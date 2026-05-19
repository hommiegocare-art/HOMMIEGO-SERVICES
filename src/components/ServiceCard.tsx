import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  rating?: number;
  reviews?: number;
  image: string;
  name: string;
}

export const ServiceCard = ({
  id,
  title,
  description,
  price,
  location,
  rating = 0,
  reviews = 0,
  image,
  name,
}: ServiceCardProps) => {

  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-secondary/10">

      <CardHeader className="p-0">

        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />

          {/* Updated Badge: Stacks "Booking Fee" above the Price */}
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-xl shadow-lg flex flex-col items-center leading-none">
            <span className="text-[8px] uppercase font-black opacity-90 mb-0.5 tracking-tighter">
              Booking Fee
            </span>
            <span className="text-sm font-bold">
              KES {price.toLocaleString()}
            </span>
          </div>
        </div>

      </CardHeader>

      <CardContent className="p-4">

        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm">

          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>

          {rating > 0 && (
            <div className="flex items-center gap-1">

              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />

              <span className="font-medium">
                {rating}
              </span>

              <span className="text-muted-foreground">
                ({reviews})
              </span>

            </div>
          )}

        </div>

        <p className="text-xs text-muted-foreground mt-2">
          by {name}
        </p>

      </CardContent>

      <CardFooter className="p-4 pt-0">

        <Button
          className="w-full"
          onClick={() => navigate(`/booking/${id}`)}
        >
          More Details
        </Button>

      </CardFooter>

    </Card>
  );
};