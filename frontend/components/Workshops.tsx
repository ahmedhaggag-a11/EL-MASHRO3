import { ArrowLeft } from "lucide-react";

export default function Workshops() {
  return (
    <section id="workshops" className="bg-ink/[0.02] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold text-coral">ورش العمل</p>
            <h2 className="text-4xl font-black text-ink">ورش تفاعلية مفتوحة للجميع</h2>
          </div>
          <a
            href="#"
            className="hidden items-center gap-2 rounded-full border border-sand bg-white px-5 py-2.5 text-sm font-bold text-ink/70 transition hover:border-coral hover:text-coral sm:inline-flex"
          >
            شوف كل الورش
            <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
        <p className="mb-12 max-w-2xl text-base leading-8 text-ink/60">
          ورش عمل مكثفة مع أفضل المدرسين — مجانية ومدفوعة — تغطي المواد اللي غالباً ما بنلاقي صعوبة فيها.
        </p>

        <div className="rounded-3xl border border-dashed border-sand bg-white p-10 text-center text-ink/60">
          سيتم الإعلان عن الورش القادمة هنا بعد اعتماد مواعيدها ومدرسيها.
        </div>
      </div>
    </section>
  );
}
