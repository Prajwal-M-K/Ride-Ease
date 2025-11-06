from flask import Flask, jsonify, request
import mysql.connector
import hashlib  # for password hashing

app = Flask(__name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def create_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",  # e.g., 'root'
        password="WJ28@krhps",
        database="ev_rental_db"
    )
    return connection

@app.route('/api/vehicles/<int:vehicle_id>/report', methods=['POST'])
def report_vehicle_issue(vehicle_id):
    """
    Reports a vehicle issue. Users can only report issues for vehicles they have an ongoing ride with.
    Admins can report issues for any vehicle.
    """
    try:
        data = request.get_json()
        issue = data['IssueReported']
        user_id = data.get('user_id')  # Get user_id from request
        user_role = data.get('user_role', 'user')  # Get user role
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        connection = create_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # If user is not admin, check if they have an ongoing ride with this vehicle
        if user_role != 'admin':
            cursor.execute("""
                SELECT TripID FROM Trips 
                WHERE UserID = %s AND VehicleID = %s AND Status = 'Ongoing'
            """, (user_id, vehicle_id))
            ongoing_trip = cursor.fetchone()
            
            if not ongoing_trip:
                cursor.close()
                connection.close()
                return jsonify({"error": "You can only report issues for vehicles you have an ongoing ride with"}), 403
        
        cursor.callproc('sp_ReportAndAssignMaintenance', [vehicle_id, issue])
        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({"message": f"Issue for vehicle {vehicle_id} reported successfully. A technician has been assigned."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    try:
        conn = create_db_connection()
        cur = conn.cursor()

        # Hash the password before storing
        hashed_pw = hash_password(data['password'])

        cur.execute("""
            INSERT INTO Users (Name, Email, Password, WalletBalance, JoinDate)
            VALUES (%s, %s, %s, 0.0, CURDATE())
        """, (data['name'], data['email'], hashed_pw))

        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Email already registered"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

#LOGIN
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.json
    email = data['email']
    password = data['password']

    try:
        conn = create_db_connection()
        cur = conn.cursor(dictionary=True)

        # Include WalletBalance, JoinDate, and Role for a consistent user object on the client
        cur.execute("SELECT UserID, Name, Email, WalletBalance, JoinDate, Password, Role FROM Users WHERE Email = %s", (email,))
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        hashed_pw = hash_password(password)
        if hashed_pw != user['Password']:
            return jsonify({"error": "Invalid password"}), 401

        # Success
        user.pop('Password')  # don't return password hash
        return jsonify({"message": "Login successful", "user": user}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

#BOOKING
@app.route('/api/book', methods=['POST'])
def book_ride():
    data = request.json
    try:
        conn = create_db_connection()
        cur = conn.cursor()
        cur.callproc("sp_CreateBooking", (
            data['user_id'], data['vehicle_id'], data['start_station_id'], data['duration_hours']
        ))
        conn.commit()
        return jsonify({"message": "Ride booked successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

#END RIDE
@app.route('/api/endride', methods=['POST'])
def end_ride():
    data = request.json
    try:
        conn = create_db_connection()
        cur = conn.cursor()
        cur.callproc("sp_EndRide", (data['trip_id'], data['end_station_id']))
        conn.commit()
        return jsonify({"message": "Ride ended successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

#USER HISTORY
@app.route('/api/user/<int:user_id>/rides', methods=['GET'])
def get_user_history(user_id):
    """
    Gets a user's ride history, with an optional query param to filter by status.
    e.g., /api/user/1/rides?status=Ongoing
    e.g., /api/user/1/rides?status=Completed
    """
    # Get the status from query parameters
    status = request.args.get('status')
    
    conn = create_db_connection()
    cur = conn.cursor(dictionary=True)
    
    query = "SELECT * FROM v_UserTripHistory WHERE UserID = %s"
    params = [user_id]
    
    # If a status is provided, add it to the query
    if status:
        query += " AND Status = %s"
        params.append(status)
        
    query += " ORDER BY StartTime DESC" # Show most recent first
    
    cur.execute(query, tuple(params))
    trips = cur.fetchall()
    
    cur.close()
    conn.close()
    return jsonify(trips)


@app.route('/api/user/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    """
    Gets a user's profile information (name, email, wallet, join date, role).
    Including Role ensures the client retains admin capabilities after refreshes.
    """
    try:
        conn = create_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT UserID, Name, Email, WalletBalance, JoinDate, Role FROM Users WHERE UserID = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/user/<int:user_id>/profile', methods=['PUT'])
def update_user_profile(user_id):
    """
    Updates a user's name or password.
    """
    data = request.json
    name = data.get('name')
    password = data.get('password')

    try:
        conn = create_db_connection()
        cur = conn.cursor()
        
        if name:
            cur.execute("UPDATE Users SET Name = %s WHERE UserID = %s", (name, user_id))
        
        if password:
            hashed_pw = hash_password(password)
            cur.execute("UPDATE Users SET Password = %s WHERE UserID = %s", (hashed_pw, user_id))
            
        conn.commit()
        
        if cur.rowcount == 0:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/user/<int:user_id>/wallet/add', methods=['POST'])
def add_to_wallet(user_id):
    """
    Adds funds to a user's wallet.
    """
    data = request.json
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({"error": "Amount must be positive"}), 400
            
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400
    except KeyError:
        return jsonify({"error": "Missing 'amount' field"}), 400

    try:
        conn = create_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Users SET WalletBalance = WalletBalance + %s WHERE UserID = %s", (amount, user_id))
        
        if cur.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        return jsonify({"message": f"Successfully added {amount} to wallet"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/stations/<int:station_id>/vehicles', methods=['GET'])
def get_vehicles_at_station(station_id):
    """
    Gets all *available* vehicles at a specific station.
    This replaces the need to call /api/vehicles and filter on the frontend.
    """
    try:
        conn = create_db_connection()
        cur = conn.cursor(dictionary=True)
        # Use the v_VehicleDetails view for rich information
        query = """
            SELECT * FROM v_VehicleDetails 
            WHERE CurrentStationName = (SELECT Name FROM Stations WHERE StationID = %s)
            AND Status = 'available'
        """
        # A more robust way would be to join Vehicles and Stations tables
        # Let's use the simple way first based on your view
        
        # A better query that doesn't rely on the view's string name:
        query_robust = """
            SELECT
                v.VehicleID, v.Type, v.Model, v.Manufacturer, v.RatePerHour, v.Status
            FROM Vehicles v
            WHERE v.CurrentStationID = %s AND v.Status = 'available'
        """
        
        cur.execute(query_robust, (station_id,))
        vehicles = cur.fetchall()
        
        return jsonify(vehicles)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/trip/<int:trip_id>/cancel', methods=['POST'])
def cancel_trip(trip_id):
    """
    Cancels an *ongoing* trip.
    This relies on the new `sp_CancelTrip` stored procedure.
    """
    # You might want to add user authentication here to ensure
    # the user cancelling the trip is the one who booked it.
    
    try:
        conn = create_db_connection()
        cur = conn.cursor()
        cur.callproc("sp_CancelTrip", (trip_id,))
        conn.commit()
        return jsonify({"message": "Trip cancelled successfully. Funds have been refunded."})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/api/trip/<int:trip_id>/review', methods=['POST'])
def add_review(trip_id):
    """
    Adds a review for a *completed* trip.
    """
    data = request.json
    try:
        rating = int(data['rating'])
        comment = data.get('comment', '') # Comment is optional
        
        if not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
            
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Invalid or missing 'rating'"}), 400

    try:
        conn = create_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # First, find the UserID and VehicleID from the trip
        cur.execute("SELECT UserID, VehicleID, Status FROM Trips WHERE TripID = %s", (trip_id,))
        trip = cur.fetchone()
        
        if not trip:
            return jsonify({"error": "Trip not found"}), 404
        
        if trip['Status'] != 'Completed':
            return jsonify({"error": "Can only review completed trips"}), 400
            
        # Insert the review
        query = """
            INSERT INTO Reviews (TripID, UserID, VehicleID, Rating, Comment, ReviewDate)
            VALUES (%s, %s, %s, %s, %s, CURDATE())
        """
        cur.execute(query, (trip_id, trip['UserID'], trip['VehicleID'], rating, comment))
        conn.commit()
        
        return jsonify({"message": "Review added successfully"}), 201
        
    except mysql.connector.IntegrityError:
        return jsonify({"error": "A review for this trip already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/stations', methods=['GET'])
def get_stations():
    """
    Gets all active stations with available vehicle counts.
    """
    try:
        conn = create_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM v_StationVehicleCount")
        stations = cur.fetchall()
        return jsonify(stations)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()




@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """
    Gets all vehicles (excluding decommissioned ones) with their details.
    """
    try:
        conn = create_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM v_VehicleDetails")
        vehicles = cur.fetchall()
        return jsonify(vehicles)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()


@app.route('/api/vehicles/<int:vehicle_id>/decommission', methods=['PUT'])
def decommission_vehicle(vehicle_id):
    """
    Decommissions a vehicle by setting Status to 'decommissioned'.
    Admin only.
    """
    try:
        data = request.get_json() or {}
        user_role = data.get('user_role', 'user')
        
        if user_role != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        conn = create_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Vehicles SET Status = 'decommissioned' WHERE VehicleID = %s", (vehicle_id,))
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": f"Vehicle {vehicle_id} decommissioned successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Admin-only routes for stations
@app.route('/api/stations', methods=['POST'])
def add_station():
    """
    Adds a new station. Admin only.
    """
    try:
        data = request.get_json()
        user_role = data.get('user_role', 'user')
        
        if user_role != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        name = data.get('name')
        location = data.get('location')
        capacity = data.get('capacity')
        
        if not all([name, location, capacity]):
            return jsonify({"error": "Name, location, and capacity are required"}), 400
        
        conn = create_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO Stations (Name, Location, Capacity, IsActive)
            VALUES (%s, %s, %s, TRUE)
        """, (name, location, capacity))
        conn.commit()
        station_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Station added successfully", "station_id": station_id}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Station name already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Note: Hard delete endpoint removed to prevent destructive operations.

@app.route('/api/stations/<int:station_id>/deactivate', methods=['PUT'])
def deactivate_station(station_id):
    """
    Deactivates a station by setting IsActive to FALSE.
    Admin only.
    """
    try:
        data = request.get_json() or {}
        user_role = data.get('user_role', 'user')
        
        if user_role != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        conn = create_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Stations SET IsActive = FALSE WHERE StationID = %s", (station_id,))
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            return jsonify({"error": "Station not found"}), 404
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": f"Station {station_id} deactivated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

# Admin-only routes for vehicles
@app.route('/api/vehicles', methods=['POST'])
def add_vehicle():
    """
    Adds a new vehicle. Admin only.
    """
    try:
        data = request.get_json()
        user_role = data.get('user_role', 'user')
        
        if user_role != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        vehicle_type = data.get('type')
        model = data.get('model')
        manufacturer = data.get('manufacturer')
        rate_per_hour = data.get('rate_per_hour')
        station_id = data.get('station_id')
        
        if not all([vehicle_type, model, manufacturer, rate_per_hour]):
            return jsonify({"error": "Type, model, manufacturer, and rate_per_hour are required"}), 400
        
        conn = create_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO Vehicles (Type, Model, Manufacturer, RatePerHour, Status, CurrentStationID)
            VALUES (%s, %s, %s, %s, 'available', %s)
        """, (vehicle_type, model, manufacturer, rate_per_hour, station_id))
        conn.commit()
        vehicle_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "Vehicle added successfully", "vehicle_id": vehicle_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Note: Hard delete endpoint removed; use decommission instead.


if __name__ == '__main__':
    app.run(debug=True)