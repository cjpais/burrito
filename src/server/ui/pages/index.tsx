import Layout from "../components/layout";
import Memory from "../components/memory";

const Index = ({ metadata, page }: { metadata: any[]; page: number }) => {
  return (
    <Layout title={process.env.BRAIN_NAME!}>
      <div
        className="mono"
        style={{
          display: "flex",
          gap: "1rem",
          paddingTop: "2rem",
          paddingBottom: "2rem",
          fontSize: ".85rem",
        }}
      >
        {page > 0 && (
          <a href={`/?p=${page - 1}`} className="link">
            previous
          </a>
        )}
        {metadata.length > 0 && (
          <a href={`/?p=${page + 1}`} className="link">
            next
          </a>
        )}
      </div>
      <div className="memory-holder">
        {metadata.map((m, id) => (
          <Memory key={id} m={m} />
        ))}
      </div>
      {metadata.length === 0 && <h2>no posts</h2>}
      <div
        className="mono"
        style={{
          display: "flex",
          gap: "1rem",
          paddingTop: "2rem",
          paddingBottom: "2rem",
          fontSize: ".85rem",
        }}
      >
        {page > 0 && (
          <a href={`/?p=${page - 1}`} className="link">
            previous
          </a>
        )}
        {metadata.length > 0 && (
          <a href={`/?p=${page + 1}`} className="link">
            next
          </a>
        )}
      </div>
    </Layout>
  );
};

export default Index;
