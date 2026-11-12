
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  SRN: string;
  Student_Name: string;
  Email: string;
  Phone: string;
  Department_Code: string;
  Department_Name: string;
}

interface Team {
  teamRecordId: number;
  status: string;
  mentorCode: string | null;
  mentorName: string | null;
  memberCount: number;
  members: Member[];
}

export default function DashboardPage() {
  const router = useRouter();

  const [team, setTeam] = useState<Team | null>(null);
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newSrn, setNewSrn] = useState("");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/my-team", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to load dashboard.");
        return;
      }

      setHasTeam(data.hasTeam);
      setTeam(data.team || null);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const srn = newSrn.trim().toUpperCase();

    if (!srn) {
      setError("Please enter the student's SRN.");
      return;
    }

    if (team && team.members.some((member) => member.SRN.toUpperCase() === srn)) {
      setError("This student is already in your team.");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/my-team/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ srn }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to add this student.");
        return;
      }

      setSuccess(
        `${data.addedStudent.name} has been added successfully. Team status: ${
          data.status === "REGISTERED_COMPLETE" ? "Complete" : "Incomplete"
        }.`
      );

      setNewSrn("");
      await loadDashboard();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-600">Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Capstone Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Student Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            View and manage your capstone team registration.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {!hasTeam && !error && (
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              No Team Registered
            </h2>

            <p className="mt-2 text-slate-600">
              You are not currently part of a registered capstone team.
            </p>

            <button
              onClick={() => router.push("/registration")}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Register a Team
            </button>
          </section>
        )}

        {hasTeam && team && (
          <div className="space-y-6">

            {/* Team overview */}
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Your Team Registration
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Internal record: {team.teamRecordId}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    team.status === "REGISTERED_COMPLETE"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {team.status === "REGISTERED_COMPLETE"
                    ? "Complete"
                    : "Incomplete"}
                </span>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Team Members</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {team.memberCount}/4
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Mentor</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {team.mentorName || "Not Assigned"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    Registration Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {team.status === "REGISTERED_COMPLETE"
                      ? "Registered"
                      : "Pending"}
                  </p>
                </div>
              </div>
            </section>

            {/* Add member */}
            {team.memberCount < 4 && (
              <section className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Add Another Team Member
                </h2>

                <p className="mt-2 text-slate-600">
                  Enter the official SRN of the student you want to add.
                  Their details will be retrieved automatically.
                </p>

                <form
                  onSubmit={handleAddMember}
                  className="mt-6 flex flex-col gap-4 sm:flex-row"
                >
                  <input
                    type="text"
                    value={newSrn}
                    onChange={(e) => setNewSrn(e.target.value.toUpperCase())}
                    placeholder="Enter student SRN"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    disabled={adding}
                    required
                  />

                  <button
                    type="submit"
                    disabled={adding}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {adding ? "Adding..." : "Add Member"}
                  </button>
                </form>

                <p className="mt-3 text-sm text-slate-500">
                  Maximum team size: four students. A student can belong to
                  only one team.
                </p>
              </section>
            )}

            {team.memberCount >= 4 && (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
                <h2 className="font-bold text-green-800">
                  Maximum Team Size Reached
                </h2>
                <p className="mt-1 text-sm text-green-700">
                  All four team member positions have been filled.
                </p>
              </section>
            )}

            {/* Registered members */}
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="mb-5 text-xl font-bold text-slate-900">
                Registered Team Members
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">SRN</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Department</th>
                    </tr>
                  </thead>

                  <tbody>
                    {team.members.map((member) => (
                      <tr
                        key={member.SRN}
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-4 font-medium">
                          {member.SRN}
                        </td>

                        <td className="px-4 py-4">
                          {member.Student_Name}
                        </td>

                        <td className="px-4 py-4">
                          {member.Email}
                        </td>

                        <td className="px-4 py-4">
                          {member.Department_Code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-sm text-slate-500">
              All registered members can view this shared team registration.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
