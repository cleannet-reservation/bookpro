import React from "react";
import { createRoot } from "react-dom/client";
import Landing from "./Landing";
import Booking from "./Booking";
import Dashboard from "./Dashboard";
import Signup from "./Signup";
import SuperAdmin from "./SuperAdmin";
import Demo from "./Demo";
import BookingSuccess from "./BookingSuccess";
import Avis from "./Avis";

const path = window.location.pathname;

let Component = Landing;
if (path.startsWith("/booking/") && path.includes("/success")) Component = BookingSuccess;
else if (path.startsWith("/booking/")) Component = Booking;
else if (path.startsWith("/dashboard")) Component = Dashboard;
else if (path.startsWith("/inscription")) Component = Signup;
else if (path.startsWith("/admin")) Component = SuperAdmin;
else if (path.startsWith("/demo")) Component = Demo;
else if (path.startsWith("/avis/")) Component = Avis;

createRoot(document.getElementById("root")).render(<Component />);
