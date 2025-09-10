export default function ErrorMessage({ error }) {
  return <div style={{ color: "red" }}>Erreur : {error.message || error.toString()}</div>;
}