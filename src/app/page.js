import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/Menu";
import Member from "@/components/Member";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="bg-[#2e2b27] text-[#e6d5b8] leading-[1.7] min-h-screen font-['Special_Elite',_monospace] bg-[length:40px_40px]">
        <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em]">
          <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">轉站人生</h1>
          <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">你的人生可能會誤點，火車也會；不是每段感情都準時，火車也是</p>
        </header>

        <Menu />

        <div className="max-w-xl mx-auto bg-[#423d35] p-10 rounded-lg shadow-lg border border-[#c4a35a] mb-20">
          <h2 className="text-[#c4a35a] text-2xl mb-6 border-l-8 border-[#c4a35a] pl-3 tracking-wide">
            溫提馨醒
          </h2>
          <p className="mb-7 text-lg tracking-wide">
            停、看、聽，平交道安全三步驟。<br />
            請勿闖越平交道，生命不容冒險。<br />
            慢一秒，換一生。快一秒，沒人生。<br />
            請勿在平交道上打瞌睡，火車來了可就來不及了！<br />
            你走得快，不如火車撞得快。
          </p>
          <a href="https://www.railway.gov.tw/tra-tip-web/adr/customized_info?I=BOdk82vOPKw4nr9W8kfiZqgN%2Bif9LX%2B2JNc1p3BG4HGpGf0rzDC8bMRG3GqlEN4q5Sm8csVG1EI%3D&site_preference=normal" 
            target="_blank" rel="noopener noreferrer"
            className="inline-block bg-[#c4a35a] text-[#2e2b27] font-extrabold py-4 px-9 rounded-full shadow-md shadow-[#c4a35aaa] hover:bg-[#9a7d3a] hover:text-[#f8f1e7] hover:shadow-[#9a7d3aaa] transition duration-300 select-none text-lg tracking-wide no-underline">
              看更多
          </a>
        </div>
      </main>
      <Member />
    </div>
  );
}
