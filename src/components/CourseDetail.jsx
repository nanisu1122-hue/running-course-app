function CourseDetail({ screen, selectedCourse }) {
  if (screen !== "detail" || !selectedCourse) {
    return null;
  }

  return (
    <article>
      {selectedCourse.name}
      {selectedCourse.distance}
      {selectedCourse.duration}
    </article>
  );
}

export default CourseDetail;