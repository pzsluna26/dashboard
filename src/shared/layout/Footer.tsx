"use client";

export default function Footer() {
  return (
    <footer className="relative w-full h-[130px] bg-white text-white overflow-hidden">
      {/* 이미지 (상단만 보이게) */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src="/main/footer.jpg"
          alt="Footer Background"
          className="w-full object-cover object-top brightness-130"
          style={{ height: "400px", marginTop: "0px" }} // 상단이 보이게
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm opacity-80">AI 입법 수요 분석 플랫폼</p>
        <h2 className="text-xl md:text-2xl font-bold mt-1 tracking-wide">
          여론나침반 © {new Date().getFullYear()}
        </h2>
        <p className="mt-2 text-xs opacity-70 max-w-md">
          본 서비스는 뉴스 및 소셜 데이터를 기반으로 입법 수요를 분석하고 사회적 반응을 시각화합니다.
        </p>
      </div>
    </footer>
  );
}
