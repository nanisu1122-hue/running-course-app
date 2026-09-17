function CourseCard({ course, onDetail }) {
  return (
    <>
      <article>
        <h2>{course.name}</h2>
        <h2>{course.distance}</h2>
        <h2>{course.duration}</h2>
      </article>
      <button onClick={() => onDetail(course)}>
        {/* PC用テキスト */}
        <span className="btn-text-PC">地図を表示</span>
        <span className="btn-text-mobile">{course.name}を表示</span>
      </button>
    </>
  );
}

export default CourseCard;