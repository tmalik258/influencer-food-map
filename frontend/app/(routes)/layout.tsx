import { Navbar } from "@/components/navbar";
import ErrorBoundary from "@/components/error-boundary";
import Footer from "@/components/footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <div>{children}</div>
      </ErrorBoundary>
      <Footer />
    </>
  );
};

export default Layout;
