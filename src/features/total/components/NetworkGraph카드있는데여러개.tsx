"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

export type PeriodKey = "daily_timeline" | "weekly_timeline" | "monthly_timeline";

type NodeType = "legal" | "incident";

interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
}

interface LegalNode extends BaseNode {
  type: "legal";
  totalCount: number;
}

interface IncidentNode extends BaseNode {
  type: "incident";
  count: number;
  mid: string;
  sample?: {
    agree?: string[];
    repeal?: string[];
    disagree?: string[];
  };
}

export interface NetworkGraphProps {
  data: any;
  startDate?: string;
  endDate?: string;
  period?: PeriodKey;
  maxArticles?: number;
}

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

function buildGraph(
  raw: any,
  opts: { startDate?: string; endDate?: string; period?: PeriodKey; maxArticles: number }
) {
  const { startDate, endDate, maxArticles } = opts;
  const domains: string[] = Object.keys(raw || {});

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
          const agreeList = (s?.["찬성"]?.["개정강화"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const repealList = (s?.["찬성"]?.["폐지약화"]?.["소셜목록"] || []) as Array<{ content: string }>;
          const disagreeList = (s?.["반대"]?.["소셜목록"] || []) as Array<{ content: string }>;
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
              sample: { agree: [], repeal: [], disagree: [] },
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

  const topLegal = Object.keys(legalMap)
    .map((k) => ({ mid: k, total: legalMap[k].total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, maxArticles)
    .map((x) => x.mid);

  const nodes: (LegalNode | IncidentNode)[] = [];
  const links: { source: string; target: string; weight: number }[] = [];

  for (const mid of topLegal) {
    nodes.push({ id: mid, type: "legal", label: mid, totalCount: legalMap[mid].total } as LegalNode);

    const incs = Object.values(legalMap[mid].incidents).filter((i) => i.count > 0);
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

  const graph = useMemo(() => buildGraph(data, { startDate, endDate, period, maxArticles }), [
    data,
    startDate,
    endDate,
    period,
    maxArticles,
  ]);

  const width = 920;
  const height = 380;

  const sizeScale = useMemo(() => {
    const counts = graph.nodes.filter((n) => n.type === "incident").map((n: any) => n.count);
    const min = d3.min(counts) ?? 1;
    const max = d3.max(counts) ?? 50;
    return d3.scaleSqrt().domain([min, max]).range([8, 36]);
  }, [graph.nodes]);

  // 초기 랜덤 선택 (incident 우선)
  useEffect(() => {
    if (!graph?.nodes?.length) return;
    if (selected) return;
    const incidents = (graph.nodes as any[]).filter((n) => n.type === "incident");
    const pool = incidents.length ? incidents : (graph.nodes as any[]);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelected(pick as any);
  }, [graph.nodes, selected]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    let g = d3.select(gRef.current);
    if (g.empty()) {
      g = svg.append("g");
      // @ts-ignore
      gRef.current = g.node();
    }

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 2])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

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

    const node = g
      .selectAll<SVGGElement, any>("g.node")
      .data(graph.nodes, (d: any) => d.id)
      .join(
        (enter) => {
          const group = enter
            .append("g")
            .attr("class", "node cursor-pointer")
            .style("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.25))");

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

          group
            .filter((d: any) => d.type === "incident")
            .append("circle")
            .attr("r", (d: any) => sizeScale(d.count))
            .attr("fill", "#e6f0ff")
            .attr("stroke", "#7aa1ff")
            .attr("stroke-width", 1.5);

          group
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

          group
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", 4)
            .attr("font-size", (d: any) => (d.type === "legal" ? 12 : 11))
            .attr("font-weight", (d: any) => (d.type === "legal" ? 700 : 500))
            .attr("fill", "#213547")
            .text((d: any) => (d.type === "legal" ? d.label : `${d.label}`));

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full h-[380px]">
      {/* 좌측: 그래프 */}
      <div className="lg:col-span-2 rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-3 relative">
        <div className="flex items-center gap-4 text-xs text-neutral-600 px-2 pb-2">
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#e6f0ff] border border-[#7aa1ff]" /> Incident (원형)</div>
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-[#fff7ed] border border-[#f59e0b]" /> Legal Article (사각형)</div>
          <div className="ml-auto">드래그 이동 · 휠 줌 · 클릭 상세</div>
        </div>
        <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="rounded-xl bg-white/40">
          <g ref={gRef as any} />
        </svg>
      </div>

      {/* 우측: 보조 카드 */}
      <aside className="rounded-2xl bg-white/55 backdrop-blur-md border border-white/60 p-4 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="text-sm font-semibold text-neutral-800">상세 정보</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!graph.nodes || graph.nodes.length === 0) return;
                const incidents = (graph.nodes as any[]).filter((n) => n.type === "incident");
                const pool = incidents.length ? incidents : (graph.nodes as any[]);
                const pick = pool[Math.floor(Math.random() * pool.length)] as any;
                setSelected(pick);
              }}
              className="text-xs px-2 py-1 rounded-lg border border-neutral-300 hover:bg-neutral-50"
            >
              랜덤 선택
            </button>
          </div>
        </div>

        {!selected ? (
          <div className="mt-4 text-sm text-neutral-500">항목을 선택하면 상세가 표시됩니다.</div>
        ) : selected.type === "legal" ? (
          <div className="mt-4 text-sm text-neutral-700">
            <div className="text-neutral-500 text-xs mb-1">법조항</div>
            <div className="text-base font-semibold mb-2">{selected.label}</div>
            <div className="mb-2">총 소셜 코멘트 수: <b>{(selected as any).totalCount?.toLocaleString()}</b></div>
            <div className="text-xs text-neutral-500">상위 Incident 노드 크기는 코멘트 수에 비례합니다. 네트워크는 선택 기간 내 데이터로 산출됩니다.</div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-neutral-700 space-y-4">
            <div className="text-neutral-500 text-xs">Incident</div>
            <div className="text-base font-semibold">{(selected as any).label}</div>
            <div>코멘트 수: <b>{(selected as any).count?.toLocaleString()}</b></div>
            {(() => {
              const inc: any = selected;
              const Block = ({ title, arr }: { title: string; arr?: string[] }) => (
                <div>
                  <div className="text-xs font-medium text-neutral-500 mb-1">{title}</div>
                  <ul className="list-disc pl-4 text-xs text-neutral-700 space-y-1">
                    {(arr && arr.length > 0 ? arr : ["(표본 없음)"]).slice(0, 5).map((t, i) => (
                      <li key={i} className="line-clamp-2">{t}</li>
                    ))}
                  </ul>
                </div>
              );
              return (
                <div className="grid grid-cols-1 gap-3">
                  <Block title="찬성 · 개정강화 (표본)" arr={inc.sample?.agree} />
                  <Block title="찬성 · 폐지약화 (표본)" arr={inc.sample?.repeal} />
                  <Block title="반대 (표본)" arr={inc.sample?.disagree} />
                </div>
              );
            })()}
          </div>
        )}
      </aside>
    </div>
  );
}
