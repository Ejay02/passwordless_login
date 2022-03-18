import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
// import About from '../views/About.vue'
import vm from "../main";

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Login.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// navigation guard
router.beforeEach(async (to, from, next) => {
  // if theres a session token in query
  if (to.query.session_token) {
    // store token in lcoal storage
    localStorage.setItem("session_token", to.query.session_token);
    // remove query string from token
    router.replace({ 'query': null });
  }

  // if session token in local storage set token or set to null
  const token = localStorage.getItem("session_token") || null;

  // if theres meta data
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    //check  if theres token
    if (token) {
      // request to api to verify token if valid continue
      const response = await fetch("http://localhost:5000/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      }).then((res) => res.json());

      if (!response.success) {
        localStorage.removeItem("session_token");
        vm.$toast.error("Oh Dear!  Something went wrong, please try again.");
        next("/login");
        return;
      }
    } else {
      // if no token return to login
      next("/login");
      return;
    }
    // check if we're on the login page,
  } else if (to.matched.some((record) => record.name === "login")) {
    // check if theres a token and verify on api
    if (token) {
      // request to api to verify token if valid continue
      const response = await fetch("http://localhost:5000/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      }).then((res) => res.json());

      if (response.success) {
        next("/");
        return;
      }
    }
  }

  // if nothing above matches
  next();
});

export default router;
