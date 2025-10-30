export const getPieChartData = (subVal: any) => {
  const 찬성 = subVal.counts?.찬성 ?? 0;
  const 반대 = subVal.counts?.반대 ?? 0;

  return [
    { name: "찬성", value: 찬성, fill: "#AFC8AD" },
    { name: "반대", value: 반대, fill: "#D6D3CA" },
  ];
};

export const getChannelBarData = (subVal: any) => {
  const map: Record<string, number> = {};

  const 채널리스트 = ["blog", "twitter", "community", "insta"];
  for (const c of 채널리스트) map[c] = 0;

  for (const list of [
    ...(subVal.찬성?.개정강화?.소셜목록 || []),
    ...(subVal.찬성?.폐지약화?.소셜목록 || []),
    ...(subVal.반대?.소셜목록 || []),
  ]) {
    map[list.channel] = (map[list.channel] || 0) + 1;
  }

  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
  }));
};
