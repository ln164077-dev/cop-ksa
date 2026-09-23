import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import Admin from "./pages/Admin";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BookingSeats from "./pages/BookingSeats";
import BookingDetails from "./pages/BookingDetails";
import BookingPaymentPending from "./pages/BookingPaymentPending";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking/seats" component={BookingSeats} />
      <Route path="/booking/details" component={BookingDetails} />
      <Route path="/booking/payment-pending" component={BookingPaymentPending} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster dir="rtl" position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
