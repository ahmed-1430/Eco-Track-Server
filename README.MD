

```
# ⚙️ EcoTrack Server — RESTful API  

The **EcoTrack Server** powers the backend of the **EcoTrack Sustainable Living Community**, managing data for challenges, events, and eco-tips.  
Built with **Express** and **MongoDB**, it provides a fast and secure RESTful API for the client app. 🌎  

---

## 🔗 Live Server  
**Base URL:** https://eco-track-server-zeta.vercel.app/ 

---

## 🧭 API Endpoints  

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/challenges` | Fetch all challenges (supports filters) |
| GET | `/api/challenges/:id` | Get single challenge details |
| POST | `/api/challenges` | Add a new challenge |
| PATCH | `/api/challenges/:id` | Update challenge |
| DELETE | `/api/challenges/:id` | Delete challenge |
| POST | `/api/challenges/join/:id` | Join a challenge |
| GET | `/api/tips` | Get eco-tips |
| GET | `/api/events` | Get upcoming events |

---

## 🧰 Tech Stack  

| Category | Technology |
|-----------|-------------|
| Server Framework | Express.js |
| Database | MongoDB |
| Security | dotenv |
| CORS Handling | cors |
| Deployment | Vercel |

---

