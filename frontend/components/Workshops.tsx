import { ArrowLeft, Calendar, Clock } from "lucide-react";

export default async function Workshops() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/workshops/featured`, {
    next: { revalidate: 60 },
  }).catch(() => null);
  
  const workshops = res?.ok ? await res.json() : [];

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

        {workshops.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop: any) => {
              const startDate = new Date(workshop.startsAt);
              return (
                <div key={workshop.id} className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="inline-block rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                      {workshop.type === 'FREE' ? 'مجانية' : `${workshop.priceEGP} جنيه`}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-ink">{workshop.title}</h3>
                  <p className="mb-6 text-sm text-ink/60 line-clamp-2">{workshop.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-ink/70">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-coral" />
                      {startDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-coral" />
                      {startDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-sand bg-white p-10 text-center text-ink/60">
            سيتم الإعلان عن الورش القادمة هنا بعد اعتماد مواعيدها ومدرسيها.
          </div>
        )}
      </div>
    </section>
  );
}
