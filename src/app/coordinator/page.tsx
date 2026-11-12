
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface CertificateSummary {
  signatureId: number;
  teamRecordId: number;
  versionNumber: number;
  payloadHash: string;
  signatureValue: string;
  signedAt: string;
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
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [issuingCertificateTeam, setIssuingCertificateTeam] = useState<number | null>(null);
  const [certificates, setCertificates] = useState<Record<number, CertificateSummary>>({});

  // Load coordinator dashboard data.
  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [teamResponse, mentorResponse] = await Promise.all([
        fetch("/api/coordinator/teams", { cache: "no-store" }),
        fetch("/api/mentors", { cache: "no-store" }),
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
          teamData.message || "Unable to load dashboard."
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
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Search and filter teams.
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "COMPLETE" &&
          team.status === "REGISTERED_COMPLETE") ||
        (filter === "INCOMPLETE" &&
          team.status === "REGISTERED_INCOMPLETE");

      const term = search.toLowerCase().trim();

      const matchesSearch =
        !term ||
        String(team.teamRecordId).includes(term) ||
        (team.mentorName || "").toLowerCase().includes(term) ||
        (team.mentorCode || "").toLowerCase().includes(term) ||
        team.members.some(
          (member) =>
            member.srn.toLowerCase().includes(term) ||
            member.studentName.toLowerCase().includes(term) ||
            member.email.toLowerCase().includes(term)
        );

      return matchesFilter && matchesSearch;
    });
  }, [teams, filter, search]);

  // Derive coordinator intelligence metrics from the existing dashboard data.
  const totalMembers = teams.reduce((total, team) => total + team.members.length, 0);
  const completionRate =
    statistics.totalTeams > 0
      ? Math.round((statistics.completeTeams / statistics.totalTeams) * 100)
      : 0;

  const mentorWorkload = mentors
    .map((mentor) => ({
      code: mentor.Mentor_Code,
      name: mentor.Mentor_Name,
      designation: mentor.Designation,
      department: mentor.Department_Code,
      teamCount: teams.filter((team) => team.mentorCode === mentor.Mentor_Code).length,
    }))
    .sort((a, b) => b.teamCount - a.teamCount || a.name.localeCompare(b.name));

  const departmentParticipation = Object.values(
    teams.reduce<Record<string, { code: string; name: string; count: number }>>(
      (result, team) => {
        team.members.forEach((member) => {
          const code = member.departmentCode || "UNKNOWN";
          if (!result[code]) {
            result[code] = {
              code,
              name: member.departmentName || code,
              count: 0,
            };
          }
          result[code].count += 1;
        });
        return result;
      },
      {}
    )
  ).sort((a, b) => b.count - a.count);

  const highestDepartmentCount = Math.max(
    1,
    ...departmentParticipation.map((department) => department.count)
  );

  const highestMentorWorkload = Math.max(
    1,
    ...mentorWorkload.map((mentor) => mentor.teamCount)
  );

  // Assign a mentor to a team.
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamRecordId, mentorCode }),
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

  // Unassign the currently assigned mentor.
  async function unassignMentor(teamRecordId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to unassign the mentor from this team?"
    );

    if (!confirmed) {
      return;
    }

    setAssigningTeam(teamRecordId);
    setActionMessage("");

    try {
      const response = await fetch("/api/coordinator/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  // Remove an individual student from a team.
  async function removeMember(
    teamRecordId: number,
    member: Member
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.studentName} (${member.srn}) from Team #${teamRecordId}?\n\nThis action will remove the student's membership from this team.`
    );

    if (!confirmed) {
      return;
    }

    const removalKey = `${teamRecordId}-${member.srn}`;

    setRemovingMember(removalKey);
    setActionMessage("");

    try {
      const response = await fetch("/api/coordinator/teams", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamRecordId,
          srn: member.srn,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setActionMessage(
          data.message || "Unable to remove the student."
        );
        return;
      }

      setActionMessage(
        `${member.studentName} was removed successfully. Team #${teamRecordId} now has ${data.team.memberCount} member(s) and is ${data.team.status === "REGISTERED_COMPLETE" ? "complete" : "incomplete"}.`
      );

      await loadDashboard();
    } catch {
      setActionMessage(
        "Unable to connect to the server while removing the student."
      );
    } finally {
      setRemovingMember(null);
    }
  }

  // Issue a certificate or retrieve the existing valid certificate.
  async function issueCertificate(teamRecordId: number) {
    setIssuingCertificateTeam(teamRecordId);
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/coordinator/teams/${teamRecordId}/certificate`,
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok || !data.success || !data.certificate) {
        setActionMessage(data.message || "Unable to issue the digital certificate.");
        return;
      }

      setCertificates((previous) => ({
        ...previous,
        [teamRecordId]: data.certificate as CertificateSummary,
      }));
      setActionMessage(data.message);
    } catch {
      setActionMessage("Unable to connect to the server while issuing the certificate.");
    } finally {
      setIssuingCertificateTeam(null);
    }
  }

  // Coordinator logout.
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
        {/* Dashboard heading */}
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
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Dashboard statistics */}
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
            title="Teams Without Mentors"
            value={statistics.unassignedMentors}
            description="Pending mentor assignment"
            color="red"
          />
        </section>

        {/* Capstone Intelligence: decision-support insights from live database data. */}
        <section className="mb-8 space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Coordinator insights
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Capstone Intelligence Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registration readiness, mentor workload and cross-department participation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800">Registration readiness</h3>
              <div className="mt-5 flex items-end justify-between">
                <p className="text-4xl font-bold text-slate-900">{completionRate}%</p>
                <p className="text-sm text-slate-500">
                  {statistics.completeTeams} / {statistics.totalTeams} complete
                </p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-500">
                <span>{statistics.incompleteTeams} incomplete</span>
                <span>{totalMembers} students registered</span>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">Mentor workload</h3>
                <span className="text-xs text-slate-500">Teams assigned per mentor</span>
              </div>
              {mentorWorkload.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">No mentor information is available.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {mentorWorkload.map((mentor) => (
                    <div key={mentor.code}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-slate-700">
                          {mentor.name} <span className="text-slate-400">({mentor.department})</span>
                        </span>
                        <span className="shrink-0 font-semibold text-slate-700">
                          {mentor.teamCount} {mentor.teamCount === 1 ? "team" : "teams"}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${(mentor.teamCount / highestMentorWorkload) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-800">Department-wise participation</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registered team members grouped by their department.
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {totalMembers} total participants
              </span>
            </div>
            {departmentParticipation.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">No registered student participation yet.</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {departmentParticipation.map((department) => (
                  <div key={department.code} className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{department.code}</p>
                        <p className="text-xs text-slate-500">{department.name}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{department.count}</p>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${(department.count / highestDepartmentCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        {/* Search and filters */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
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
                placeholder="Search by team ID, SRN, student or mentor..."
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

        {/* Action feedback */}
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
                  {/* Team heading */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Team Record #{team.teamRecordId}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {team.memberCount} of 4 members registered
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={team.status} />
                      {team.status === "REGISTERED_COMPLETE" && (
                        <button
                          onClick={() => void issueCertificate(team.teamRecordId)}
                          disabled={issuingCertificateTeam === team.teamRecordId}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {issuingCertificateTeam === team.teamRecordId
                            ? "Issuing..."
                            : certificates[team.teamRecordId]
                              ? "Refresh Certificate"
                              : "Issue Digital Certificate"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    {certificates[team.teamRecordId] && (
                      <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold text-indigo-900">
                            Digital Registration Certificate
                          </h4>
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            ISSUED · VERSION {certificates[team.teamRecordId].versionNumber}
                          </span>
                        </div>
                        <p className="mt-3 break-all text-xs text-slate-600">
                          SHA-256: {certificates[team.teamRecordId].payloadHash}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Signed at: {new Date(certificates[team.teamRecordId].signedAt).toLocaleString()}
                        </p>
                        <a
                          href={`/api/verify/team/${team.teamRecordId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block font-semibold text-indigo-700 underline hover:text-indigo-900"
                        >
                          View public verification result (JSON)
                        </a>
                      </div>
                    )}
                    {/* Current mentor */}
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
                          <option value="">Select a mentor</option>

                          {mentors.map((mentor) => (
                            <option
                              key={mentor.Mentor_Code}
                              value={mentor.Mentor_Code}
                            >
                              {mentor.Mentor_Name} ({mentor.Designation}) -{" "}
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
                          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

                    {/* Team members */}
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
                          <table className="w-full min-w-[850px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-3 py-3">SRN</th>
                                <th className="px-3 py-3">Student Name</th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Phone</th>
                                <th className="px-3 py-3">Department</th>
                                <th className="px-3 py-3">Action</th>
                              </tr>
                            </thead>

                            <tbody>
                              {team.members.map((member) => {
                                const removalKey = `${team.teamRecordId}-${member.srn}`;

                                return (
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

                                    <td className="px-3 py-3">
                                      <button
                                        onClick={() =>
                                          void removeMember(
                                            team.teamRecordId,
                                            member
                                          )
                                        }
                                        disabled={
                                          removingMember === removalKey
                                        }
                                        className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {removingMember === removalKey
                                          ? "Removing..."
                                          : "Remove"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
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

// Statistics card component.
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
      <p className="text-sm font-medium text-slate-500">{title}</p>

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

// Team status badge component.
function StatusBadge({ status }: { status: Team["status"] }) {
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
