import { getPrivacyPolicy } from "@/lib/privacy";
import {
  BackToTop,
  PrintButton,
  PrivacyToc,
  ReadingProgress,
} from "./PrivacyInteractive";

const heading = "font-[family-name:var(--font-space-grotesk)]";

export default async function PrivacyPage() {
  const policy = await getPrivacyPolicy();

  const [intro, ...sections] = policy.sections;
  const introText = intro?.blocks?.[0]?.text;
  const tocItems = sections.map((s) => ({ id: s.id, title: s.title }));

  return (
    <>
      <ReadingProgress />

      {/* Hero */}
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Legal
          </p>
          <h1
            className={`${heading} text-4xl font-bold tracking-tight sm:text-5xl`}
          >
            Privacy Policy
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-neutral-600 dark:text-white/70">
            <span className="font-medium">{policy.brandName}</span>
            <span aria-hidden>•</span>
            <span>{policy.lastUpdatedLabel}</span>
            <span className="ml-auto">
              <PrintButton />
            </span>
          </div>

          {introText && (
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-neutral-700 dark:text-white/80">
              {introText}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-12 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <aside>
          <PrivacyToc items={tocItems} />
        </aside>

        <main className="min-w-0">
          <div className="space-y-6">
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8 print:break-inside-avoid print:border-0 print:p-0 print:shadow-none"
              >
                <div className="mb-5 flex items-baseline gap-4">
                  <span
                    className={`${heading} text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2
                    className={`${heading} text-xl font-bold tracking-tight sm:text-2xl`}
                  >
                    <a
                      href={`#${section.id}`}
                      className="hover:underline hover:underline-offset-4"
                    >
                      {section.title}
                    </a>
                  </h2>
                </div>

                <div className="space-y-6">
                  {section.blocks.map((block, bi) => (
                    <div key={bi} className="space-y-3">
                      {block.heading && (
                        <h3 className="text-base font-semibold">
                          {block.heading}
                        </h3>
                      )}

                      {block.text && (
                        <p className="leading-7 text-neutral-700 dark:text-white/80">
                          {block.text}
                        </p>
                      )}

                      {block.bullets && block.bullets.length > 0 && (
                        <ul className="space-y-3">
                          {block.bullets.map((bullet, bi2) => (
                            <li
                              key={bi2}
                              className="flex gap-3 leading-7 text-neutral-700 dark:text-white/80"
                            >
                              <span
                                aria-hidden
                                className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                              />
                              <span>
                                {bullet.label && (
                                  <span className="font-semibold text-neutral-900 dark:text-white">
                                    {bullet.label}{" "}
                                  </span>
                                )}
                                {bullet.detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contact card */}
          <footer className="mt-10 rounded-2xl bg-[#10352c] p-8 text-white dark:bg-emerald-500/10 dark:ring-1 dark:ring-white/10 print:bg-transparent print:p-0 print:text-black">
            <h2 className={`${heading} text-xl font-bold`}>
              Questions about your data?
            </h2>
            <p className="mt-2 max-w-xl text-white/80 print:text-black">
              If you have questions about this policy or want to exercise your
              privacy rights, our team is happy to help.
            </p>
            <a
              href={`mailto:${policy.contactEmail}`}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#10352c] transition hover:bg-emerald-50 print:p-0 print:underline"
            >
              {policy.contactEmail}
            </a>
          </footer>
        </main>
      </div>

      <BackToTop />
    </>
  );
}
