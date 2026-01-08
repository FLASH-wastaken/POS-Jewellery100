/*
  REMINDERS TAB
  
  Automated reminders for memo holders
  Features:
  - Auto-send reminders 1, 2, or 3 days before due date
  - Choose reminder type (Email, WhatsApp, SMS)
  - View pending reminders
  - Track sent reminders
*/

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertCircle } from "lucide-react"

export function RemindersTab() {
  const reminders = []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Memo Reminders</h2>
          <p className="text-muted-foreground mt-1">Automatic reminders for memo holders before due date</p>
        </div>
      </div>

      {/* Reminders Configuration Card */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Reminder Settings
          </CardTitle>
          <CardDescription>Configure automatic reminders sent to memo holders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((day) => (
              <div key={day} className="p-4 rounded-lg border border-white/10 bg-muted/50">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="font-medium">
                    {day} day{day > 1 ? "s" : ""} before
                  </span>
                </label>
                <select className="w-full mt-2 p-2 rounded border border-white/10 bg-background text-sm">
                  <option>Email</option>
                  <option>WhatsApp</option>
                  <option>SMS</option>
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {reminders.length === 0 ? (
        <Card className="glass-effect border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No pending reminders. They will appear here as memo due dates approach.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">{/* Reminders list will render here */}</div>
      )}
    </div>
  )
}
