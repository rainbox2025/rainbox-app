import React from 'react'

export default function BillingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Billing</h2>
        <p className="text-muted-foreground text-sm">Manage your subscription and payment methods</p>
      </div>

      <div className="space-y-6">
        <div className="p-4 border border-border rounded-md">
          <h3 className="font-medium mb-2">Current Plan</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-md font-medium">Free</p>
              <p className="text-sm text-muted-foreground">Basic features included</p>
            </div>
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors">
              Upgrade
            </button>
          </div>
        </div>

        <div className="p-4 border border-border rounded-md">
          <h3 className="font-medium mb-2">Payment Methods</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have any payment methods added yet.
          </p>
          <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-hovered transition-colors">
            Add payment method
          </button>
        </div>
      </div>
    </div>
  )
}
