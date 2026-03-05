import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Container from "../components/ui/Container";

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-6">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
}