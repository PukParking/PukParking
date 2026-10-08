PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ADMINISTRATOR (
    Administrator_ID TEXT PRIMARY KEY NOT NULL,
    Administrator_Username TEXT NOT NULL,
    Administrator_passwordHash TEXT NOT NULL,
    Administrator_Permissions TEXT
);

CREATE TABLE IF NOT EXISTS BUILDING (
    Building_ID TEXT PRIMARY KEY NOT NULL,
    Administrator_ID TEXT NOT NULL,
    Building_Name TEXT NOT NULL,
    Building_Abbreviation TEXT NOT NULL,
    Building_Description TEXT,
    Building_Latitude REAL NOT NULL,
    Building_Longitude REAL NOT NULL,

    FOREIGN KEY (Administrator_ID)
        REFERENCES ADMINISTRATOR(Administrator_ID)
);

CREATE TABLE IF NOT EXISTS PARKING_AREA (
    Parking_Area_ID TEXT PRIMARY KEY NOT NULL,
    Administrator_ID TEXT NOT NULL,
    Parking_Area_Name TEXT NOT NULL,
    Parking_Area_Latitude REAL NOT NULL,
    Parking_Area_Longitude REAL NOT NULL,
    Parking_Type TEXT NOT NULL
        CHECK (Parking_Type IN ('student', 'staff', 'visitor')),
    Parking_Area_Capacity INTEGER NOT NULL,
    Parking_Area_Occupied_Spaces INTEGER NOT NULL DEFAULT 0,
    Parking_Area_Restrictions TEXT,
    Parking_Area_Operating_Hours TEXT,
    Parking_Area_Accessible_Spaces INTEGER DEFAULT 0,
    Parking_Area_Image_URL TEXT,
    Parking_Area_IsActive INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (Administrator_ID)
        REFERENCES ADMINISTRATOR(Administrator_ID)
);

CREATE TABLE IF NOT EXISTS PARKING_FULL_REPORT (
    Report_ID TEXT PRIMARY KEY NOT NULL,
    Parking_Area_ID TEXT NOT NULL,
    Report_Submitted_Time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Report_Expiry_Time TEXT NOT NULL,

    FOREIGN KEY (Parking_Area_ID)
        REFERENCES PARKING_AREA(Parking_Area_ID)
);
