"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"

// Mock data based on the provided JSON structure
const mockClients = [
  {
    name: "Arcfil",
    db_name: "Arcfil",
    ga_name: "Arcfil",
    docker_version: "0.7.1",
    cron: { expression: "0 7,15 * * *", timezone: "America/Toronto" },
    reports: [
      {
        type: "powerbi",
        name: "Arcfil",
        group_id: "eaf9fc56-bf8d-41ca-91d0-e02835b73823",
        dataset_id: "8f676918-21ae-4520-bb92-7d82c36b6430",
      },
    ],
    toggles: ["new_part_events"],
  },
  {
    name: "TechCorp",
    db_name: "TechCorp",
    ga_name: "TechCorp",
    docker_version: "0.8.2",
    cron: { expression: "0 9 * * *", timezone: "America/New_York" },
    reports: [
      { type: "powerbi", name: "TechCorp Main", group_id: "abc123-def456-ghi789", dataset_id: "xyz789-uvw456-rst123" },
      {
        type: "powerbi",
        name: "TechCorp Analytics",
        group_id: "def456-ghi789-jkl012",
        dataset_id: "uvw456-rst123-mno345",
      },
    ],
    toggles: ["part_events", "custom"],
  },
]

const timezones = [
  "America/Toronto",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
]

const availableToggles = [
  { value: "new_part_events", label: "New Part Events" },
  { value: "part_events", label: "Part Events" },
  { value: "performance_loss", label: "Performance Loss" },
  { value: "custom", label: "Custom" },
]

export default function AirflowManagement() {
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [clientData, setClientData] = useState<any>(null)
  const [newReport, setNewReport] = useState({ name: "", group_id: "", dataset_id: "" })
  const [showAddReport, setShowAddReport] = useState(false)

  const handleClientSelect = (clientName: string) => {
    setSelectedClient(clientName)
    const client = mockClients.find((c) => c.name === clientName)
    setClientData(client ? { ...client } : null)
    setShowAddReport(false)
  }

  const handleSave = () => {
    alert(`Configuration saved for ${selectedClient}!`)
  }

  const handleAddReport = () => {
    if (newReport.name && newReport.group_id && newReport.dataset_id) {
      setClientData({
        ...clientData,
        reports: [...clientData.reports, { type: "powerbi", ...newReport }],
      })
      setNewReport({ name: "", group_id: "", dataset_id: "" })
      setShowAddReport(false)
      alert("Report added successfully!")
    }
  }

  const handleRemoveReport = (index: number) => {
    const updatedReports = clientData.reports.filter((_: any, i: number) => i !== index)
    setClientData({ ...clientData, reports: updatedReports })
    alert("Report removed successfully!")
  }

  const handleToggleChange = (toggleValue: string, checked: boolean) => {
    const currentToggles = clientData.toggles || []
    let updatedToggles

    if (checked) {
      updatedToggles = [...currentToggles, toggleValue]
    } else {
      updatedToggles = currentToggles.filter((toggle: string) => toggle !== toggleValue)
    }

    setClientData({
      ...clientData,
      toggles: updatedToggles,
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">App CS Airflow - Customer Success</h1>

      {/* Client Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClient} onValueChange={handleClientSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {mockClients.map((client) => (
                <SelectItem key={client.name} value={client.name}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {clientData && (
        <>
          {/* Airflow Configurations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Airflow Configurations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="docker-version">Docker Version</Label>
                <Input
                  id="docker-version"
                  value={clientData.docker_version}
                  onChange={(e) => setClientData({ ...clientData, docker_version: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cron-expression">Cron Expression</Label>
                <Input
                  id="cron-expression"
                  value={clientData.cron.expression}
                  onChange={(e) =>
                    setClientData({
                      ...clientData,
                      cron: { ...clientData.cron, expression: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={clientData.cron.timezone}
                  onValueChange={(value) =>
                    setClientData({
                      ...clientData,
                      cron: { ...clientData.cron, timezone: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Feature Toggles</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {availableToggles.map((toggle) => (
                    <div key={toggle.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={toggle.value}
                        checked={clientData.toggles?.includes(toggle.value) || false}
                        onChange={(e) => handleToggleChange(toggle.value, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={toggle.value} className="text-sm font-normal">
                        {toggle.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} className="mt-4">
                Save Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Power BI Reports */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Power BI Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Group ID</TableHead>
                    <TableHead>Dataset ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientData.reports.map((report: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{report.name}</TableCell>
                      <TableCell className="font-mono text-sm">{report.group_id}</TableCell>
                      <TableCell className="font-mono text-sm">{report.dataset_id}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveReport(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!showAddReport && (
                <Button onClick={() => setShowAddReport(true)} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Report
                </Button>
              )}

              {showAddReport && (
                <div className="mt-4 p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Add New Report</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Report Name"
                      value={newReport.name}
                      onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    />
                    <Input
                      placeholder="Group ID"
                      value={newReport.group_id}
                      onChange={(e) => setNewReport({ ...newReport, group_id: e.target.value })}
                    />
                    <Input
                      placeholder="Dataset ID"
                      value={newReport.dataset_id}
                      onChange={(e) => setNewReport({ ...newReport, dataset_id: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddReport}>Add Report</Button>
                    <Button variant="outline" onClick={() => setShowAddReport(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monitoring Information */}
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Last DAG Run</h4>
                  <p className="text-2xl font-bold">2 hours ago</p>
                  <p className="text-sm text-muted-foreground">Status: Success</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Average Runtime</h4>
                  <p className="text-2xl font-bold">12.5 min</p>
                  <p className="text-sm text-muted-foreground">Last 10 runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
