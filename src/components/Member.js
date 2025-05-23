import Link from "next/link";// 導入 Link 組件，用於導航

export default function Member() {
  return (
    <footer className="bg-[#1e1b17] text-white p-4">
        <h2 className="text-xl mb-4">
            製作人員
        </h2>
        <p className="mb-7 text-lg tracking-wide">
            <span className="text-[#c4a35a]">林冠成</span>、<span className="text-[#c4a35a]">東佑旭</span>、<span className="text-[#c4a35a]">要發癲了</span><span className="text-[#1e1b18]">、AI工具</span>
        </p>
    </footer>
  );
}
