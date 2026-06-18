import type { ITeacher } from "@/models/Teacher";
import { CURRICULUM } from "@/lib/curriculum";

// Resolve any curriculum slug — classes AND active breaks (e.g. go-karting) — to its display name.
const COURSE_NAMES = new Map(CURRICULUM.map((course) => [course.slug, course.name]));

export function teacherCourseNames(slugs: string[] = []): string[] {
  return slugs.map((slug) => COURSE_NAMES.get(slug) ?? slug).filter(Boolean);
}

export function teacherHeadline(teacher: Pick<ITeacher, "name" | "assignedCourses">): string {
  const courses = teacherCourseNames(teacher.assignedCourses ?? []);
  if (courses.length === 0) return "Supports the full camp";
  if (courses.length === 1) return `Leads ${courses[0]}`;
  if (courses.length === 2) return `Leads ${courses[0]} and ${courses[1]}`;
  return `Leads ${courses[0]}, ${courses[1]} and ${courses.length - 2} more`;
}

export function teacherBio(teacher: Pick<ITeacher, "name" | "assignedCourses" | "bio" | "isActive">): string {
  const customBio = teacher.bio?.trim();
  if (customBio) return customBio;

  const courses = teacherCourseNames(teacher.assignedCourses ?? []);
  if (courses.length === 0) {
    return `${teacher.name} is part of the IMMERSIA teaching team and supports the full bootcamp across classes, activities and camper safety.`;
  }

  const coursesText =
    courses.length === 1
      ? courses[0]
      : courses.length === 2
      ? `${courses[0]} and ${courses[1]}`
      : `${courses[0]}, ${courses[1]} and ${courses.length - 2} more`;

  return `${teacher.name} teaches ${coursesText} at IMMERSIA, helping campers build real projects with confidence, collaboration and plenty of hands-on practice.`;
}

export function excerpt(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${shortened.trimEnd()}...`;
}

export function teacherStatusLabel(isActive: boolean) {
  return isActive ? "Active" : "Inactive";
}
