"use client";

import { useEffect, useState } from "react";

interface TeamMember {
  srn: string;
  studentName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  lookupStatus: "idle" | "loading" | "found" | "not-found" | "error";
  lookupMessage: string;
}

interface Mentor {
  Mentor_Code: string;
  Mentor_Name: string;
  Designation: string;
  Department_Name: string;
}

const createEmptyMember = (): TeamMember => ({
  srn: "",
  studentName: "",
  email: "",
  phone: "",
  departmentId: "",
  departmentName: "",
  departmentCode: "",
  lookupStatus: "idle",
  lookupMessage: "",
});

export default function RegistrationPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    createEmptyMember(),
  ]);

  const [mentorCode, setMentorCode] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadMentors() {
      try {
        const response = await fetch("/api/mentors");
        const data = await response.json();

        if (response.ok && data.success) {
          setMentors(data.mentors);
        }
      } catch (error) {
        console.error("Unable to load mentors:", error);
      } finally {
        setLoadingMentors(false);
      }
    }

    void loadMentors();
  }, []);

  function updateMember(
    index: number,
    field: "srn",
    value: string
  ) {
    setMembers((current) =>
      current.map((member, i) =>
        i === index
          ? {
              ...createEmptyMember(),
              srn: value,
            }
          : member
      )
    );
  }

  async function lookupStudent(index: number) {
    const member = members[index];
    const srn = member.srn.trim();

    if (!srn) {
      setMembers((current) =>
        current.map((item, i) =>
          i === index ? createEmptyMember() : item
        )
      );
      return;
    }

    setMembers((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              lookupStatus: "loading",
              lookupMessage: "Searching the official student directory...",
            }
          : item
      )
    );

    try {
      const response = await fetch(
        `/api/students?srn=${encodeURIComponent(srn)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMembers((current) =>
          current.map((item, i) =>
            i === index
              ? {
                  ...createEmptyMember(),
                  srn,
                  lookupStatus:
                    response.status === 404 ? "not-found" : "error",
                  lookupMessage:
                    data.message || "Unable to find student details.",
                }
              : item
          )
        );
        return;
      }

      const student = data.student;

      setMembers((current) =>
        current.map((item, i) =>
          i === index
            ? {
                ...item,
                srn: student.SRN,
                studentName: student.Student_Name,
                email: student.Email,
                phone: student.Phone ?? "",
                departmentId: String(student.Department_ID),
                departmentName: student.Department_Name,
                departmentCode: student.Department_Code,
                lookupStatus: "found",
                lookupMessage: "Student details verified.",
              }
            : item
        )
      );
    } catch (error) {
      console.error("Student lookup failed:", error);

      setMembers((current) =>
        current.map((item, i) =>
          i === index
            ? {
                ...createEmptyMember(),
                srn,
                lookupStatus: "error",
                lookupMessage:
                  "Unable to connect to the student directory. Please try again.",
              }
            : item
        )
      );
    }
  }

  function addMember() {
    if (members.length < 4) {
      setMembers((current) => [...current, createEmptyMember()]);
    }
  }

  function removeMember(index: number) {
    if (members.length > 1) {
      setMembers((current) => current.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (members.some((member) => member.lookupStatus !== "found")) {
      setMessage(
        "Please enter a valid SRN and verify every team member before submitting."
      );
      return;
    }

    const srns = members.map((member) => member.srn.trim().toUpperCase());

    if (new Set(srns).size !== srns.length) {
      setMessage("A student cannot appear more than once in the same team.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        mentorCode: mentorCode || null,
        members: members.map((member) => ({
          srn: member.srn,
          studentName: member.studentName,
          email: member.email,
          phone: member.phone,
          departmentId: Number(member.departmentId),
        })),
      };

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Team registration failed.");
      }

      setSuccess(true);
      setMessage(
        `Registration submitted successfully. Current status: ${data.status}.`
      );
      setMembers([createEmptyMember()]);
      setMentorCode("");
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Capstone Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Team Registration
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Register your Semester 5 capstone team. A team can contain one to
            four students. Mentor assignment is optional during registration.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Team members</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter an SRN to retrieve the student&apos;s official details.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                {members.length}/4 members
              </span>
            </div>

            <div className="space-y-5">
              {members.map((member, index) => (
                <fieldset
                  key={index}
                  className="rounded-xl border border-slate-200 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <legend className="font-semibold">
                      Student {index + 1}
                    </legend>

                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium sm:col-span-2">
                      Student Registration Number (SRN)
                      <input
                        required
                        value={member.srn}
                        onChange={(event) =>
                          updateMember(index, "srn", event.target.value)
                        }
                        onBlur={() => void lookupStudent(index)}
                        placeholder="Enter SRN, then move to the next field"
                        autoComplete="off"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        Student details will be retrieved when you leave this
                        field.
                      </span>
                    </label>

                    {member.lookupStatus !== "idle" && (
                      <div
                        role="status"
                        aria-live="polite"
                        className={`sm:col-span-2 rounded-lg p-3 text-sm ${
                          member.lookupStatus === "found"
                            ? "bg-green-50 text-green-800"
                            : member.lookupStatus === "loading"
                              ? "bg-blue-50 text-blue-800"
                              : "bg-red-50 text-red-800"
                        }`}
                      >
                        {member.lookupMessage}
                      </div>
                    )}

                    <label className="block text-sm font-medium">
                      Full name
                      <input
                        readOnly
                        value={member.studentName}
                        placeholder="Automatically populated"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Email
                      <input
                        readOnly
                        type="email"
                        value={member.email}
                        placeholder="Automatically populated"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Phone
                      <input
                        readOnly
                        value={member.phone}
                        placeholder="Automatically populated"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Department
                      <input
                        readOnly
                        value={
                          member.departmentName
                            ? `${member.departmentCode} — ${member.departmentName}`
                            : ""
                        }
                        placeholder="Automatically populated"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none"
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>

            {members.length < 4 && (
              <button
                type="button"
                onClick={addMember}
                className="mt-4 rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                + Add another student
              </button>
            )}
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold">Mentor assignment</h2>

            <p className="mt-1 text-sm text-slate-500">
              You may leave this unassigned and complete registration later.
            </p>

            <label className="mt-4 block text-sm font-medium">
              Select mentor
              <select
                value={mentorCode}
                onChange={(event) => setMentorCode(event.target.value)}
                disabled={loadingMentors}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {loadingMentors
                    ? "Loading mentors..."
                    : "No mentor assigned"}
                </option>

                {mentors.map((mentor) => (
                  <option key={mentor.Mentor_Code} value={mentor.Mentor_Code}>
                    {mentor.Mentor_Name} — {mentor.Designation} (
                    {mentor.Department_Name})
                  </option>
                ))}
              </select>

              {!loadingMentors && mentors.length === 0 && (
                <span className="mt-1 block text-xs font-normal text-amber-700">
                  No active mentors are currently available in the database.
                </span>
              )}
            </label>
          </section>

          {message && (
            <div
              role="status"
              className={`rounded-lg p-4 text-sm ${
                success
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <div className="border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={submitting || loadingMentors}
              className="w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit registration"}
            </button>

            <p className="mt-3 text-xs text-slate-500">
              A registration is marked complete only when four members and a
              mentor are recorded. Otherwise, it remains incomplete.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}