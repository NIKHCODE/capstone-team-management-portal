
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Student Registration",
    description:
      "Students register using their official SRN and university email. Their academic details are retrieved from the student database.",
  },
  {
    number: "02",
    title: "Team Management",
    description:
      "Create capstone teams, add members and track registration progress through a shared team dashboard.",
  },
  {
    number: "03",
    title: "Faculty Mentorship",
    description:
      "Coordinators assign faculty mentors and monitor team registration requirements.",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.35),_transparent_55%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200">
              CAPSTONE PROJECT MANAGEMENT
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Bring your capstone team
              <span className="block text-blue-400">
                together in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              A centralized platform for students and coordinators to manage
              capstone team registration, faculty mentorship and registration
              progress.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Sign in to Portal →
              </Link>

              <Link
                href="/signup"
                className="rounded-xl border border-slate-600 bg-white/5 px-7 py-4 font-bold text-white transition hover:bg-white/10"
              >
                Student Signup
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Secure access for registered students and authorized coordinators.
            </p>
          </div>

          {/* Portal workflow illustration - no fabricated team data */}
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-7">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
                How the portal works
              </p>

              <h2 className="mt-3 text-2xl font-extrabold">
                From registration to mentorship
              </h2>

              <div className="mt-7 space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-white p-5 text-slate-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    👨‍🎓
                  </div>
                  <div>
                    <h3 className="font-bold">Student Access</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Secure SRN-based registration and login
                    </p>
                  </div>
                </div>

                <div className="flex justify-center text-blue-300">
                  ↓
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-white p-5 text-slate-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                    👥
                  </div>
                  <div>
                    <h3 className="font-bold">Team Formation</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Register members and share team information
                    </p>
                  </div>
                </div>

                <div className="flex justify-center text-blue-300">
                  ↓
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-white p-5 text-slate-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-bold">Coordinator Management</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Assign mentors and monitor registration status
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            One centralized platform
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything your capstone registration needs
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Designed to simplify coordination between students, teams and
            faculty mentors.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-sm font-extrabold tracking-widest text-blue-600">
                {feature.number}
              </p>

              <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>

              <p className="mt-3 leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="rounded-3xl bg-blue-700 px-7 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold">
            Ready to manage your capstone registration?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
            Access your student account or sign in as an authorized coordinator
            to manage capstone registrations.
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex rounded-xl bg-white px-7 py-3.5 font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Access the Portal →
          </Link>
        </div>
      </section>
    </div>
  );
}
