import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function BookingConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 text-center bg-gradient-to-br from-card to-secondary/10">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            
            <h1 className="text-3xl font-bold mb-4">Booking Confirmed! 🎉</h1>
            
            <p className="text-muted-foreground mb-8">
              Your booking has been confirmed and the provider has been notified.
            </p>

            <Card className="p-6 mb-8 bg-background">
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono font-semibold">{id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono font-semibold">MPX{Date.now()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold text-green-600">KES 15,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-green-600">Confirmed</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary-dark"
                onClick={() => navigate(`/chat/${id}`)}
              >
                Go to Messages
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/my-bookings")}
              >
                View My Bookings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
