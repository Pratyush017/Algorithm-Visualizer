import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
      <header className="space-y-4">
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">
          Interactive OS Resource Contention Sandbox &amp; Scheduling Analyzer
        </h1>
        <p className="text-[16px] text-[#6B6B6B]">
          A deterministic simulation sandbox for operating system CPU scheduling algorithms and resource allocation deadlock avoidance.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Link
          href="/scheduling"
          className="block p-6 bg-[#FFFFFF] border border-[#E5E5E0] hover:border-[#2E3A59] transition-colors group"
        >
          <h2 className="text-[20px] font-semibold text-[#1A1A1A] group-hover:text-[#2E3A59]">
            CPU Scheduling
          </h2>
          <p className="text-[14px] text-[#6B6B6B] mt-2">
            Non-preemptive SJF, Shortest Remaining Time First (SRTF), Round Robin, and Priority with aging.
          </p>
        </Link>

        <Link
          href="/deadlock"
          className="block p-6 bg-[#FFFFFF] border border-[#E5E5E0] hover:border-[#2E3A59] transition-colors group"
        >
          <h2 className="text-[20px] font-semibold text-[#1A1A1A] group-hover:text-[#2E3A59]">
            Deadlock Avoidance
          </h2>
          <p className="text-[14px] text-[#6B6B6B] mt-2">
            Dijkstra&apos;s Banker&apos;s safety algorithm and step-by-step vector comparison trace.
          </p>
        </Link>
      </section>
    </div>
  );
}
