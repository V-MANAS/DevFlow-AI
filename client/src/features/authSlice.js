import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../configs/api.js";

// Fetch current user from /api/auth/me
export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get("/api/auth/me");
        return data.user;
    } catch (error) {
        return rejectWithValue(error?.response?.data?.message || "Failed to authenticate");
    }
});

// Login action
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            console.log("1. loginUser started");
            console.log("2. Email:", email);

            const { data } = await api.post(
                "/api/auth/login",
                { email, password }
            );

            console.log("3. Login API response:", data);

            return data.user;

        } catch (error) {
            console.log("4. Login error:", error);
            console.log("5. Error response:", error.response);

            return rejectWithValue(
                error?.response?.data?.message || "Login failed"
            );
        }
    }
);

// Register action
export const registerUser = createAsyncThunk("auth/registerUser", async ({ name, email, password }, { rejectWithValue }) => {
    try {
        const { data } = await api.post("/api/auth/register", { name, email, password });
        return data.user;
    } catch (error) {
        return rejectWithValue(error?.response?.data?.message || "Registration failed");
    }
});

// Logout action
export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { rejectWithValue }) => {
    try {
        await api.post("/api/auth/logout");
        return null;
    } catch (error) {
        return rejectWithValue(error?.response?.data?.message || "Logout failed");
    }
});

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchCurrentUser
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.loading = false;
            })
            // loginUser
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.loading = false;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // registerUser
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.loading = false;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // logoutUser
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.loading = false;
                state.error = null;
            });
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
