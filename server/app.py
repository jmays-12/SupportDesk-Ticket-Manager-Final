import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
# from flask_marshmallow import Marshmallow
# from marshmallow import ValidationError

from models import db, User, Customer, Ticket, TicketNote
# from schemas import UserSchema, CustomerSchema, TicketSchema, TicketNoteSchema


load_dotenv()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

db.init_app(app)
migrate = Migrate(app, db)


# auth routes

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Name, email, and password are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already in use"}), 409

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = User(name=data["name"], email=data["email"], password_hash=hashed)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email
    }), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.check_password_hash(
        user.password_hash,
        data["password"]
    ):
        return jsonify({"error": "Invalid email or password"}), 401

    # store user id as the identity in the token
    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200


# user routes

@app.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.order_by(User.name).all()

    return jsonify([
        {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
        for user in users
    ]), 200


# customer routes

@app.route("/api/customers", methods=["GET"])
@jwt_required()
def get_customers():
    customers = Customer.query.order_by(Customer.id).all()

    return jsonify([
        {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "phone_number": customer.phone_number
        }
        for customer in customers
    ]), 200


@app.route("/api/customers", methods=["POST"])
@jwt_required()
def create_customer():
    data = request.get_json()

    if not data.get("name") or not data.get("email"):
        return jsonify({"error": "Name and email are required"}), 400

    if Customer.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Customer email already in use"}), 409

    customer = Customer(
        name=data["name"],
        email=data["email"],
        phone_number=data.get("phone_number")
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone_number": customer.phone_number
    }), 201


@app.route("/api/customers/<int:id>", methods=["PATCH"])
@jwt_required()
def update_customer(id):
    customer = db.session.get(Customer, id)

    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    data = request.get_json()

    if "name" in data:
        if not data["name"]:
            return jsonify({"error": "Name cannot be empty"}), 400
        customer.name = data["name"]

    if "email" in data:
        if not data["email"]:
            return jsonify({"error": "Email cannot be empty"}), 400

        existing_customer = Customer.query.filter_by(email=data["email"]).first()

        if existing_customer and existing_customer.id != customer.id:
            return jsonify({"error": "Customer email already in use"}), 409

        customer.email = data["email"]

    if "phone_number" in data:
        customer.phone_number = data["phone_number"]

    db.session.commit()

    return jsonify({
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone_number": customer.phone_number
    }), 200


@app.route("/api/customers/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_customer(id):
    customer = db.session.get(Customer, id)

    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    db.session.delete(customer)
    db.session.commit()

    return jsonify({"message": "Customer deleted successfully"}), 200


# ticket routes

@app.route("/api/tickets", methods=["GET"])
@jwt_required()
def get_tickets():
    tickets = Ticket.query.order_by(Ticket.id).all()

    return jsonify([
        {
            "id": ticket.id,
            "subject": ticket.subject,
            "description": ticket.description,
            "status": ticket.status,
            "priority": ticket.priority,
            "customer_id": ticket.customer_id,
            "customer_name": ticket.customer.name,
            "assigned_user_id": ticket.assigned_user_id,
            "assigned_user_name": ticket.assigned_user.name if ticket.assigned_user else None,
            "created_at": ticket.created_at.isoformat()
        }
        for ticket in tickets
    ]), 200


@app.route("/api/tickets/<int:id>", methods=["GET"])
@jwt_required()
def get_ticket(id):
    ticket = db.session.get(Ticket, id)

    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    return jsonify({
        "id": ticket.id,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "customer_id": ticket.customer_id,
        "customer_name": ticket.customer.name,
        "assigned_user_id": ticket.assigned_user_id,
        "assigned_user_name": ticket.assigned_user.name if ticket.assigned_user else None,
        "created_at": ticket.created_at.isoformat(),
        "notes": [
            {
                "id": note.id,
                "content": note.content,
                "user_id": note.user_id,
                "user_name": note.user.name,
                "created_at": note.created_at.isoformat()
            }
            for note in ticket.notes
        ]
    }), 200


@app.route("/api/tickets", methods=["POST"])
@jwt_required()
def create_ticket():
    data = request.get_json()

    if not data.get("subject") or not data.get("description") or not data.get("customer_id"):
        return jsonify({"error": "Subject, description, and customer_id are required"}), 400

    if not db.session.get(Customer, data["customer_id"]):
        return jsonify({"error": "Customer not found"}), 404

    if data.get("assigned_user_id") and not db.session.get(User, data["assigned_user_id"]):
        return jsonify({"error": "Assigned user not found"}), 404

    try:
        ticket = Ticket(
            subject=data["subject"],
            description=data["description"],
            customer_id=data["customer_id"],
            assigned_user_id=data.get("assigned_user_id"),
            status=data.get("status", "open"),
            priority=data.get("priority", "medium")
        )
        db.session.add(ticket)
        db.session.commit()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({
        "id": ticket.id,
        "subject": ticket.subject,
        "status": ticket.status,
        "priority": ticket.priority,
        "customer_id": ticket.customer_id,
        "assigned_user_id": ticket.assigned_user_id
    }), 201


@app.route("/api/tickets/<int:id>", methods=["PATCH"])
@jwt_required()
def update_ticket(id):
    ticket = db.session.get(Ticket, id)

    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    data = request.get_json()

    if "subject" in data:
        if not data["subject"]:
            return jsonify({"error": "Subject cannot be empty"}), 400
        ticket.subject = data["subject"]

    if "description" in data:
        if not data["description"]:
            return jsonify({"error": "Description cannot be empty"}), 400
        ticket.description = data["description"]

    if "assigned_user_id" in data:
        if data["assigned_user_id"] and not db.session.get(User, data["assigned_user_id"]):
            return jsonify({"error": "Assigned user not found"}), 404
        ticket.assigned_user_id = data["assigned_user_id"]

    try:
        if "status" in data:
            ticket.status = data["status"]
        if "priority" in data:
            ticket.priority = data["priority"]
        db.session.commit()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({
        "id": ticket.id,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "customer_id": ticket.customer_id,
        "customer_name": ticket.customer.name,
        "assigned_user_id": ticket.assigned_user_id,
        "assigned_user_name": ticket.assigned_user.name if ticket.assigned_user else None,
        "created_at": ticket.created_at.isoformat()
    }), 200


@app.route("/api/tickets/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_ticket(id):
    ticket = db.session.get(Ticket, id)

    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    db.session.delete(ticket)
    db.session.commit()

    return jsonify({"message": "Ticket deleted successfully"}), 200


# ticket note routes

@app.route("/api/tickets/<int:id>/notes", methods=["POST"])
@jwt_required()
def create_ticket_note(id):
    ticket = db.session.get(Ticket, id)

    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    data = request.get_json()

    if not data.get("content"):
        return jsonify({"error": "Content is required"}), 400

    # get the current user from the jwt token instead of trusting the request body
    current_user_id = int(get_jwt_identity())

    if not db.session.get(User, current_user_id):
        return jsonify({"error": "User not found"}), 404

    note = TicketNote(
        ticket_id=id,
        user_id=current_user_id,
        content=data["content"]
    )

    db.session.add(note)
    db.session.commit()

    return jsonify({
        "id": note.id,
        "content": note.content,
        "user_id": note.user_id,
        "user_name": note.user.name,
        "created_at": note.created_at.isoformat()
    }), 201


@app.route("/api/notes/<int:id>", methods=["PATCH"])
@jwt_required()
def update_ticket_note(id):
    note = db.session.get(TicketNote, id)

    if not note:
        return jsonify({"error": "Note not found"}), 404

    # make sure only the note's author can edit it
    current_user_id = int(get_jwt_identity())
    if note.user_id != current_user_id:
        return jsonify({"error": "You can only edit your own notes"}), 403

    data = request.get_json()

    if not data.get("content"):
        return jsonify({"error": "Content cannot be empty"}), 400

    note.content = data["content"]
    db.session.commit()

    return jsonify({
        "id": note.id,
        "content": note.content,
        "user_id": note.user_id,
        "user_name": note.user.name,
        "created_at": note.created_at.isoformat()
    }), 200


@app.route("/api/notes/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_ticket_note(id):
    note = db.session.get(TicketNote, id)

    if not note:
        return jsonify({"error": "Note not found"}), 404

    # make sure only the note's author can delete it
    current_user_id = int(get_jwt_identity())
    if note.user_id != current_user_id:
        return jsonify({"error": "You can only delete your own notes"}), 403

    db.session.delete(note)
    db.session.commit()

    return jsonify({"message": "Note deleted successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)