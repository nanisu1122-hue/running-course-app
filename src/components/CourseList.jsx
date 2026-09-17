import CourseCard from "./CourseCard";

function CourseList({ courses, onDetail, onBack }) {
  return (
    <div className="course-list">
      {courses.map((course) => (
        <div className="course-card" key={course.id}>
          <CourseCard course={course} onDetail={onDetail} />
        </div>
      ))}
      <button onClick={() => onBack()}>検索画面に戻る</button>
    </div>
  );
}

export default CourseList;