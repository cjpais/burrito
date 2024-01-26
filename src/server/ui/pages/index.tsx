import Layout from "../components/layout";
import Memory from "../components/memory";

const Index = ({ metadata }: { metadata: any[] }) => {
  return (
    <Layout title={process.env.BRAIN_NAME!}>
      <div className="memory-holder">
        {metadata.map((m, id) => (
          <Memory key={id} m={m} />
        ))}
      </div>
    </Layout>
  );
};

export default Index;
