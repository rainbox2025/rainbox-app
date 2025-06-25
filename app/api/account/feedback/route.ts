import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        const { feedback } = await request.json();

        // 1. Validate the incoming feedback
        if (!feedback || !feedback.trim()) {
            return NextResponse.json({ error: "Feedback cannot be empty" }, { status: 400 });
        }

        // 2. Get the authenticated user from the session
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // 3. Insert the feedback into the database
        const { error: feedbackError } = await supabase.from("feedbacks").insert({
            email: user.email,
            username: user.user_metadata?.full_name, // Use optional chaining for safety
            feedback: feedback.trim(),
        });

        if (feedbackError) {
            console.error("Error saving feedback:", feedbackError);
            // Throw the error to be caught by the outer try-catch block
            throw feedbackError;
        }

        // 4. Return a success response
        return NextResponse.json({
            success: true,
            message: "Feedback submitted successfully"
        });

    } catch (error: any) {
        // Catch any errors from the process and return a generic server error
        console.error("Feedback submission error:", error);
        return NextResponse.json(
            { error: "Failed to process request", details: error.message },
            { status: 500 }
        );
    }
}