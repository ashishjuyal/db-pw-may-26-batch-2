package codesmells.ooabusers.switches;

class Car implements ICar {
    public static final int SPORTS = 1;
    public static final int FAMILY = 2;
    public static final int SMALL = 3;
    public static final int DEFAULT = 4;
    private int type;

    public int type() {
        return this.type;
    }

    Car(int type) {
        this.type = type;
    }

    @Override
    public String fuelCapacity() {
        switch(type()) {
            case Car.SPORTS:
                return "100 liters";
            case Car.FAMILY:
                return "40 liters";
            case Car.SMALL:
                return "20 liters";
            default:
                return "50 liters";
        }
    }

    @Override
    public String fuelAverage() {
        switch(type()) {
            case Car.SPORTS:
                return "3 Km/Liter";
            case Car.FAMILY:
                return "10 Km/Liter";
            case Car.SMALL:
                return "15 Km/Liter";
            default:
                return "12 Km/Liter";
        }
    }

    @Override
    public String features() {
        switch(type()) {
            case Car.SPORTS:
                return "Sports car limited edition";
            case Car.FAMILY:
                return "Best family car in the segment";
            case Car.SMALL:
                return "Very small car";
            default:
                return "default car";
        }
    }

}
