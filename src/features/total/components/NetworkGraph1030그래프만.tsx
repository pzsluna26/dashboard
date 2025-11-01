"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

// ============================
// Types
// ============================
export type PeriodKey = "daily_timeline" | "weekly_timeline" | "monthly_timeline";

type NodeType = "legal" | "incident";

interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
}

interface LegalNode extends BaseNode {
  type: "legal";
  totalCount: number; // 총 소셜 코멘트 수 (연결된 Incident 합)
}

interface IncidentNode extends BaseNode {
  type: "incident";
  count: number; // 소셜 코멘트 수
  mid: string; // 연결된 법조항(중분류)
  sample?: {
    agree?: string[];
    repeal?: string[];
    disagree?: string[];
  };
}

export interface NetworkGraphProps {
  data: any; // /data/data.json 전체
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  period?: PeriodKey; // 기본: daily_timeline만 사용(날짜 범위 필터 용이)
  maxArticles?: number; // TOP N
}

// ============================
// 유틸 - 날짜 비교 (YYYY-MM-DD)
// ============================
function inDateRange(dateStr: string, start?: string, end?: string) {
  if (!start && !end) return true;
  const n = (s?: string) => (s ? new Date(s + "T00:00:00").getTime() : undefined);
  const d = new Date(dateStr + "T00:00:00").getTime();
  const s = n(start);
  const e = n(end);
  if (s !== undefined && d < s) return false;
  if (e !== undefined && d > e) return false;
  return true;
}

// ============================
// 데이터 변환: TOP N 법조항(중분류)과 관련 Incident(소분류) 네트워크 생성
// ============================
function buildGraph(
  raw: any,
  opts: { startDate?: string; endDate?: string; period?: PeriodKey; maxArticles: number }
) {
  const { startDate, endDate, maxArticles } = opts;

  // 1) 일단 addsocial.daily_timeline 기준으로 집계 (날짜 필터가 쉬움)
  const domains: string[] = Object.keys(raw || {});

  // 중분류(법조항) -> 총합 및 소분류 상세 모음
  const legalMap: Record<string, { total: number; incidents: Record<string, IncidentNode> }> = {};

  for (const dom of domains) {
    const daily = raw[dom]?.addsocial?.["daily_timeline"] || {};
    for (const dateStr of Object.keys(daily)) {
      if (!inDateRange(dateStr, startDate, endDate)) continue;
      const dayEntry = daily[dateStr];
      const mids = dayEntry?.["중분류목록"] || {};

      for (const mid of Object.keys(mids)) {
        const midObj = mids[mid];
        const subs = midObj?.["소분류목록"] || {};

        for (const subKey of Object.keys(subs)) {
          const s = subs[subKey];
          const agreeCount = s?.["찬성"]?.["개정강화"]?.count || 0;
          const repealCount = s?.["찬성"]?.["폐지약화"]?.count || 0;
          const disagreeCount = s?.["반대"]?.["소셜목록"]?.length || 0; // 아래에서 정확히 다시 계산

          const agreeList = (s?.["찬성"]?.["개정강화"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const repealList = (s?.["찬성"]?.["폐지약화"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const disagreeList = (s?.["반대"]?.["소셜목록"] || []) as Array<{ content: string }>;

          // 실제 코멘트 수 = 세 목록 길이의 합
          const count = (agreeList?.length || 0) + (repealList?.length || 0) + (disagreeList?.length || 0);

          if (!legalMap[mid]) legalMap[mid] = { total: 0, incidents: {} };
          const incId = `${mid}::${subKey}`;
          if (!legalMap[mid].incidents[incId]) {
            legalMap[mid].incidents[incId] = {
              id: incId,
              type: "incident",
              label: subKey.replace(`${mid}_`, ""),
              count: 0,
              mid,
              sample: {
                agree: [],
                repeal: [],
                disagree: [],
              },
            };
          }

          legalMap[mid].incidents[incId].count += count;
          legalMap[mid].incidents[incId].sample!.agree!.push(
            ...agreeList.slice(0, 2).map((x) => x.content)
          );
          legalMap[mid].incidents[incId].sample!.repeal!.push(
            ...repealList.slice(0, 2).map((x) => x.content)
          );
          legalMap[mid].incidents[incId].sample!.disagree!.push(
            ...disagreeList.slice(0, 2).map((x) => x.content)
          );

          legalMap[mid].total += count;
        }
      }
    }
  }

  // 2) 법조항 TOP N 선택
  const topLegal = Object.keys(legalMap)
    .map((k) => ({ mid: k, total: legalMap[k].total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, maxArticles)
    .map((x) => x.mid);

  // 3) 노드/링크 구성
  const nodes: (LegalNode | IncidentNode)[] = [];
  const links: { source: string; target: string; weight: number }[] = [];

  for (const mid of topLegal) {
    nodes.push({ id: mid, type: "legal", label: mid, totalCount: legalMap[mid].total } as LegalNode);

    const incs = Object.values(legalMap[mid].incidents).filter((i) => i.count > 0);
    // 상위 Incident 10개까지 (너무 많으면 복잡)
    incs
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((inc) => {
        nodes.push(inc);
        links.push({ source: mid, target: inc.id, weight: inc.count });
      });
  }

  return { nodes, links };
}

// ============================
// 메인 컴포넌트
// ============================
export default function NetworkGraph({
  data,
  startDate,
  endDate,
  period = "daily_timeline",
  maxArticles = 5,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [selected, setSelected] = useState<LegalNode | IncidentNode | null>(null);

  // 그래프 데이터 계산
  const graph = useMemo(() => buildGraph(data, { startDate, endDate, period, maxArticles }), [
    data,
    startDate,
    endDate,
    period,
    maxArticles,
  ]);

  // 크기 & 스케일
  const width = 920; // 컨테이너 안에서 반응형으로 쓰고 싶으면 ResizeObserver 추가 가능
  const height = 380;

  const sizeScale = useMemo(() => {
    const counts = graph.nodes.filter((n) => n.type === "incident").map((n: any) => n.count);
    const min = d3.min(counts) ?? 1;
    const max = d3.max(counts) ?? 50;
    return d3.scaleSqrt().domain([min, max]).range([8, 36]);
  }, [graph.nodes]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    let g = d3.select(gRef.current);
    if (g.empty()) {
      g = svg.append("g");
      // @ts-ignore
      gRef.current = g.node();
    }

    // 줌
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 2])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // Force 시뮬레이션
    const sim = d3
      .forceSimulation(graph.nodes as any)
      .force(
        "link",
        d3
          .forceLink(graph.links as any)
          .id((d: any) => d.id)
          .distance((l: any) => 80 + Math.sqrt(l.weight || 0) * 2)
          .strength(0.2)
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d: any) => (d.type === "incident" ? sizeScale(d.count) + 8 : 38))
      );

    // 링크
    const link = g
      .selectAll<SVGLineElement, any>("line.link")
      .data(graph.links, (d: any) => `${d.source}-${d.target}`)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "link")
            .attr("stroke", "#9aa4b2")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (d: any) => Math.max(1, Math.min(4, Math.sqrt(d.weight) / 3))),
        (update) => update,
        (exit) => exit.remove()
      );

    // 노드 그룹 (모양+라벨)
    const node = g
      .selectAll<SVGGElement, any>("g.node")
      .data(graph.nodes, (d: any) => d.id)
      .join(
        (enter) => {
          const group = enter
            .append("g")
            .attr("class", "node cursor-pointer")
            .style("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.25))");

          // 드래그
          group.call(
            d3
              .drag<SVGGElement, any>()
              .on("start", (event, d: any) => {
                if (!event.active) sim.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
              })
              .on("drag", (event, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
              })
              .on("end", (event, d: any) => {
                if (!event.active) sim.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              })
          );

          // 모양
          group
            .filter((d: any) => d.type === "incident")
            .append("circle")
            .attr("r", (d: any) => sizeScale(d.count))
            .attr("fill", "#e6f0ff")
            .attr("stroke", "#7aa1ff")
            .attr("stroke-width", 1.5);

          const rect = group
            .filter((d: any) => d.type === "legal")
            .append("rect")
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("width", 140)
            .attr("height", 44)
            .attr("x", -70)
            .attr("y", -22)
            .attr("fill", "#fff7ed")
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 1.5);

          // 라벨
          group
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", (d: any) => (d.type === "legal" ? 4 : 4))
            .attr("font-size", (d: any) => (d.type === "legal" ? 12 : 11))
            .attr("font-weight", (d: any) => (d.type === "legal" ? 700 : 500))
            .attr("fill", "#213547")
            .text((d: any) => (d.type === "legal" ? d.label : `${d.label}`));

          // 클릭
          group.on("click", (_event, d: any) => setSelected(d));

          return group;
        },
        (update) => update,
        (exit) => exit.remove()
      );

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => (typeof d.source === "object" ? d.source.x : 0))
        .attr("y1", (d: any) => (typeof d.source === "object" ? d.source.y : 0))
        .attr("x2", (d: any) => (typeof d.target === "object" ? d.target.x : 0))
        .attr("y2", (d: any) => (typeof d.target === "object" ? d.target.y : 0));

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      sim.stop();
    };
  }, [graph.nodes, graph.links, sizeScale]);

  return (
    <div className="relative w-full h-[380px] rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-3">
      {/* 상단 설명/범례 */}
      <div className="flex items-center gap-4 text-xs text-neutral-600 px-2 pb-2">
        <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#e6f0ff] border border-[#7aa1ff]" /> Incident (원형)</div>
        <div className="flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-[#fff7ed] border border-[#f59e0b]" /> Legal Article (사각형)</div>
        <div className="ml-auto">드래그 이동 · 휠 줌 · 클릭 상세</div>
      </div>

      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="rounded-xl bg-white/40">
        <g ref={gRef as any} />
      </svg>

      {/* 클릭 팝업 */}
      {selected && (
        <div className="absolute right-3 bottom-3 w-[360px] max-w-[90%] bg-white rounded-2xl shadow-xl border border-neutral-200 p-4">
          <div className="flex items-start justify-between">
            <div className="text-sm font-semibold text-neutral-800">
              {selected.type === "legal" ? `법조항 · ${selected.label}` : `Incident · ${(selected as IncidentNode).label}`}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-neutral-400 hover:text-neutral-600 transition"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {selected.type === "legal" ? (
            <div className="mt-2 text-sm text-neutral-700">
              <div className="mb-2">총 소셜 코멘트 수: <b>{(selected as LegalNode).totalCount.toLocaleString()}</b></div>
              <div className="text-xs text-neutral-500">
                상위 Incident 노드 크기는 코멘트 수에 비례합니다. 네트워크는 선택 기간 내 데이터로 산출됩니다.
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-neutral-700 space-y-3">
              <div>
                코멘트 수: <b>{(selected as IncidentNode).count.toLocaleString()}</b>
              </div>
              {(() => {
                const inc = selected as IncidentNode;
                const block = (title: string, arr?: string[]) => (
                  <div>
                    <div className="text-xs font-medium text-neutral-500">{title}</div>
                    <ul className="list-disc pl-4 text-xs text-neutral-700 space-y-1">
                      {(arr && arr.length > 0 ? arr : ["(표본 없음)"]).slice(0, 3).map((t, i) => (
                        <li key={i} className="line-clamp-2">{t}</li>
                      ))}
                    </ul>
                  </div>
                );
                return (
                  <div className="grid grid-cols-1 gap-3">
                    {block("찬성 · 개정강화 (표본)", inc.sample?.agree)}
                    {block("찬성 · 폐지약화 (표본)", inc.sample?.repeal)}
                    {block("반대 (표본)", inc.sample?.disagree)}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
