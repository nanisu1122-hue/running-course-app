function ErrorMessage({ error, onBack }) {
  return (
    <div className="back-loading">
      <h2 className="error">{error}</h2>
      <button onClick={() => onBack()}>検索画面に戻る</button>
    </div>
  );
}

export default ErrorMessage;