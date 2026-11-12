
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

interface Member {
  srn: string;
  studentName: string;
  email: string;
  phone: string;
  departmentCode: string;
  departmentName: string;
}

interface Team {
  teamRecordId: number;
  status: "REGISTERED_INCOMPLETE" | "REGISTERED_COMPLETE";
  mentorCode: string | null;
  mentorName: string | null;
  mentorEmail: string | null;
  memberCount: number;
  members: Member[];
}

interface Statistics {
  totalTeams: number;
  completeTeams: number;
  incompleteTeams: number;
  unassignedMentors: number;
}

interface Mentor {
  Mentor_Code: string;
  Mentor_Name: string;
  Designation: string;
  Department_Code: string;
  Department_Name: string;
}

type FilterType = "ALL" | "COMPLETE" | "INCOMPLETE";

export default function CoordinatorDashboard() {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalTeams: 0,
    completeTeams: 0,
    incompleteTeams: 0,
    unassignedMentors: 0,
  });

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<
    Record<number, string>
  >({});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [assigningTeam, setAssigningTeam] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [teamResponse, mentorResponse] = await Promise.all([
        fetch("/api/coordinator/teams", {
          cache: "no-store",
        }),
        fetch("/api/mentors", {
          cache: "no-store",
        }),
      ]);

      if (teamResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (teamResponse.status === 403) {
        router.replace("/dashboard");
        return;
      }

      const teamData = await teamResponse.json();

      if (!teamResponse.ok || !teamData.success) {
        throw new Error(
          teamData.message || "Unable to load coordinator dashboard."
        );
      }

      setTeams(teamData.teams || []);
      setStatistics(teamData.statistics);

      if (mentorResponse.ok) {
        const mentorData = await mentorResponse.json();

        if (mentorData.success) {
          setMentors(mentorData.mentors || []);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "COMPLETE" &&
          team.status === "REGISTERED_COMPLETE") ||
        (filter === "INCOMPLETE" &&
          team.status === "REGISTERED_INCOMPLETE");

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        searchText === "" ||
        String(team.teamRecordId).includes(searchText) ||
        (team.mentorName || "").toLowerCase().includes(searchText) ||
        (team.mentorCode || "").toLowerCase().includes(searchText) ||
        team.members.some(
          (member) =>
            member.srn.toLowerCase().includes(searchText) ||
            member.studentName.toLowerCase().includes(searchText) ||
            member.email.toLowerCase().includes(searchText)
        );

      return matchesFilter && matchesSearch;
    });
  }, [teams, filter, search]);

  async function assignMentor(teamRecordId: number) {
    const mentorCode = selectedMentors[teamRecordId];

    if (!mentorCode) {
      setActionMessage("Please select a mentor.");
      return;
    }

    setAssigningTeam(teamRecordId);
    setActionMessage("");

    try {
      const response = await fetch("/api/coordinator/teams", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamRecordId,
          mentorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setActionMessage(
          data.message || "Mentor assignment failed."
        );
        return;
      }

      setActionMessage(data.message);
      await loadDashboard();
    } catch {
      setActionMessage("Unable to connect to the server.");
    } finally {
      setAssigningTeam(null);
    }
  }

  async function unassignMentor(teamRecordId: number) {
    setAssigningTeam(teamRecordId);
    setActionMessage("");

    try {
      const response = await fetch("/api/coordinator/teams", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamRecordId,
          mentorCode: null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setActionMessage(
          data.message || "Unable to unassign mentor."
        );
        return;
      }

      setSelectedMentors((previous) => ({
        ...previous,
        [teamRecordId]: "",
      }));

      setActionMessage(data.message);
      await loadDashboard();
    } catch {
      setActionMessage("Unable to connect to the server.");
    } finally {
      setAssigningTeam(null);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-lg font-medium text-slate-600">
          Loading coordinator dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Capstone Management Portal
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Coordinator Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Manage team registrations and mentor assignments.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Teams"
            value={statistics.totalTeams}
            description="All registered teams"
          />

          <StatCard
            title="Complete Teams"
            value={statistics.completeTeams}
            description="Four members and a mentor"
            color="green"
          />

          <StatCard
            title="Incomplete Teams"
            value={statistics.incompleteTeams}
            description="Pending requirements"
            color="amber"
          />

          <StatCard
            title="Mentor Unassigned"
            value={statistics.unassignedMentors}
            description="Teams without mentors"
            color="red"
          />
        </section>

        {/* Search and filters */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label
                htmlFor="team-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search registrations
              </label>

              <input
                id="team-search"
                type="text"
                placeholder="Search by team record ID, SRN, student or mentor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-full lg:w-64">
              <label
                htmlFor="team-filter"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Filter by status
              </label>

              <select
                id="team-filter"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as FilterType)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              >
                <option value="ALL">All Teams</option>
                <option value="COMPLETE">Complete</option>
                <option value="INCOMPLETE">Incomplete</option>
              </select>
            </div>
          </div>
        </section>

        {/* Action message */}
        {actionMessage && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"
          >
            {actionMessage}
          </div>
        )}

        {/* Team registrations */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              Team Registrations
            </h2>

            <button
              onClick={() => void loadDashboard()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                No teams found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {teams.length === 0
                  ? "No team registrations are available yet."
                  : "Try changing your search or status filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTeams.map((team) => (
                <article
                  key={team.teamRecordId}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Team header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Team Record #{team.teamRecordId}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {team.memberCount} of 4 members registered
                      </p>
                    </div>

                    <StatusBadge status={team.status} />
                  </div>

                  <div className="p-5">

                    {/* Mentor details */}
                    <div className="mb-5 rounded-lg bg-slate-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Current Mentor
                      </p>

                      {team.mentorName ? (
                        <>
                          <p className="font-semibold text-slate-900">
                            {team.mentorName}
                          </p>

                          <p className="text-sm text-slate-500">
                            {team.mentorCode} · {team.mentorEmail}
                          </p>
                        </>
                      ) : (
                        <p className="font-medium text-amber-700">
                          No mentor assigned
                        </p>
                      )}
                    </div>

                    {/* Mentor assignment */}
                    <div className="mb-6">
                      <label
                        htmlFor={`mentor-${team.teamRecordId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Assign or change mentor
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                          id={`mentor-${team.teamRecordId}`}
                          value={
                            selectedMentors[team.teamRecordId] ??
                            team.mentorCode ??
                            ""
                          }
                          onChange={(event) =>
                            setSelectedMentors((previous) => ({
                              ...previous,
                              [team.teamRecordId]: event.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3"
                        >
                          <option value="">
                            Select a mentor
                          </option>

                          {mentors.map((mentor) => (
                            <option
                              key={mentor.Mentor_Code}
                              value={mentor.Mentor_Code}
                            >
                              {mentor.Mentor_Name} (
                              {mentor.Designation}) -{" "}
                              {mentor.Department_Code}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() =>
                            void assignMentor(team.teamRecordId)
                          }
                          disabled={
                            assigningTeam === team.teamRecordId ||
                            mentors.length === 0
                          }
                          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {assigningTeam === team.teamRecordId
                            ? "Updating..."
                            : "Assign Mentor"}
                        </button>

                        {team.mentorCode && (
                          <button
                            onClick={() =>
                              void unassignMentor(team.teamRecordId)
                            }
                            disabled={
                              assigningTeam === team.teamRecordId
                            }
                            className="rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Unassign
                          </button>
                        )}
                      </div>

                      {mentors.length === 0 && (
                        <p className="mt-2 text-sm text-amber-700">
                          No active mentors are currently available.
                        </p>
                      )}
                    </div>

                    {/* Members */}
                    <div>
                      <h4 className="mb-3 font-semibold text-slate-800">
                        Registered Members
                      </h4>

                      {team.members.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No members registered.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[650px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-3 py-3 font-semibold">
                                  SRN
                                </th>

                                <th className="px-3 py-3 font-semibold">
                                  Student Name
                                </th>

                                <th className="px-3 py-3 font-semibold">
                                  Email
                                </th>

                                <th className="px-3 py-3 font-semibold">
                                  Phone
                                </th>

                                <th className="px-3 py-3 font-semibold">
                                  Department
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {team.members.map((member) => (
                                <tr
                                  key={member.srn}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="px-3 py-3 font-medium text-slate-800">
                                    {member.srn}
                                  </td>

                                  <td className="px-3 py-3 text-slate-700">
                                    {member.studentName}
                                  </td>

                                  <td className="px-3 py-3 text-slate-600">
                                    {member.email}
                                  </td>

                                  <td className="px-3 py-3 text-slate-600">
                                    {member.phone}
                                  </td>

                                  <td className="px-3 py-3 text-slate-600">
                                    {member.departmentCode}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-slate-200 py-5 text-center text-sm text-slate-500">
          Capstone Team Management Portal
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  color = "blue",
}: {
  title: string;
  value: number;
  description: string;
  color?: "blue" | "green" | "amber" | "red";
}) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p
        className={`mt-3 inline-block rounded-md border px-2 py-1 text-xs font-medium ${colors[color]}`}
      >
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Team["status"];
}) {
  const isComplete = status === "REGISTERED_COMPLETE";

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        isComplete
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {isComplete ? "COMPLETE" : "INCOMPLETE"}
    </span>
  );
}
