import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate M-Pesa payment processing
    setTimeout(() => {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your booking has been confirmed",
      });
      navigate(`/booking/confirmation/${bookingId}`);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">Payment</h1>

          <Card className="p-8 bg-gradient-to-br from-card to-secondary/10">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold mb-2">Booking Summary</h3>
              <p className="text-muted-foreground">Booking ID: {bookingId}</p>
            </div>

            <div className="border-t border-b py-6 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-semibold">KES 15,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-semibold">KES 500</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Total Amount</span>
                <span className="text-primary">KES 15,500</span>
              </div>
            </div>

            {isProcessing ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold">Processing Payment...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please check your phone for M-Pesa prompt
                </p>
              </div>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg h-14"
                onClick={handlePayment}
              >
                Pay with M-Pesa
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
