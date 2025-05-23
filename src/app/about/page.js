import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/Menu";
import Member from "@/components/Member";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
        <main className="bg-[#2e2b27] text-[#e6d5b8] leading-[1.7] min-h-screen font-['Special_Elite',_monospace] bg-[length:40px_40px]">
            <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em]">
                <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">關於</h1>
                <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">這是一個用來比主標長的副標</p>
            </header>

            <Menu />

            <div className="grid grid-cols-2 gap-8">
                <div className="max-w-xl mx-auto bg-[#423d35] px-10 pt-10 rounded-lg shadow-lg border border-[#c4a35a] mr-2">
                    <h2 className="text-[#c4a35a] text-2xl mb-6 border-l-8 border-[#c4a35a] pl-3 tracking-wide">
                        網頁簡介
                    </h2>
                    <p className="mb-7 text-md tracking-wide">
                        本網站是為了紀錄台灣鐵路的資訊而設計的，包含了台鐵、高鐵。<br />
                        這個網站的設計靈感來自於火車站的公告欄，讓使用者能夠快速找到所需的資訊。<br />
                        希望這個網站能夠幫助到需要的人，讓大家都能夠便利地搭乘火車。
                    </p>
                </div>
                <div className="max-w-xl mx-auto bg-[#423d35] px-10 pt-10 rounded-lg shadow-lg border border-[#c4a35a] ml-2">
                    <h2 className="text-[#c4a35a] text-2xl mb-6 border-l-8 border-[#c4a35a] pl-3 tracking-wide">
                        資料來源
                    </h2>
                    <p className="mb-7 text-lg tracking-wide">
                        本網站的資料來源主要是來自於TDX運輸資料流通服務，<br />
                        感謝您的支持與理解！<br />
                    </p>
                </div>
            </div>
        </main>
        <Member />
    </div>
  );
}
