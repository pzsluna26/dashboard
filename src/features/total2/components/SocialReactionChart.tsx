"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface Props {
  agree: number;
  disagree: number;
  강화: number;
  완화: number;
}

export default function SocialReactionChart({ agree, disagree, 강화, 완화 }: Props) {
 const data = {
  labels: ["찬반", "세부"],

  datasets: [
    {
      label: "찬성",
      data: [agree, 0],
      backgroundColor: "#E1F0DA",
      stack: "total",
      barThickness: 40,
      grouped: false, // ✅ 그룹 간 나란히 X
    },
    {
      label: "반대",
      data: [disagree, 0],
      backgroundColor: "#D4E7C5",
      stack: "total",
      barThickness: 40,
      grouped: false,
    },
    {
      label: "강화",
      data: [0, 강화],
      backgroundColor: "#BFD8AF",
      stack: "detail",
      barThickness: 40,
      grouped: false,
    },
    {
      label: "완화",
      data: [0, 완화],
      backgroundColor: "#99BC85",
      stack: "detail",
      barThickness: 40,
      grouped: false,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      categoryPercentage: 0.6,
      barPercentage: 0.8,
    },
    y: {
      stacked: true,
      beginAtZero: true,
      max: Math.max(agree + disagree, 강화 + 완화),
    },
  },
};



  return <Bar data={data} options={options} />;
}
