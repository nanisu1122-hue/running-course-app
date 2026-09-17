import Loading from "./Loading";
import SearchForm from "./SearchForm";
import CourseList from "./CourseList";
import ErrorMessage from "./ErrorMessage";

function LeftPanel({
  screen,
  distance,
  onDistanceChange,
  onSearch,
  courses,
  onDetail,
  error,
  onBack,
}) {
  if (screen === "error") {
    return (
      <ErrorMessage
        error={error}
        onBack={onBack}
      />
    );
  }

  if (screen === "search")
    return (
      <SearchForm
        distance={distance}
        onDistanceChange={onDistanceChange}
        onSearch={onSearch}
      />
    );

  if (screen === "loading") return <Loading />;

  if (screen === "courses" || screen === "detail")
    return (
      <CourseList
        courses={courses}
        onDetail={onDetail}
        onBack={onBack}
      />
    );
  return null;
}

export default LeftPanel;
