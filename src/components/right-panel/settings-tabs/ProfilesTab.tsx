import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2 } from 'lucide-react'

const profiles = [
  { id: 1, name: "John Doe", avatar: "/avatars/01.png", collections: 5, folders: 10, images: 1000, tags: 15 },
  { id: 2, name: "Jane Smith", avatar: "/avatars/02.png", collections: 3, folders: 5, images: 500, tags: 8 },
]

export function ProfilesTab() {
  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <Card key={profile.id}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar>
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle>{profile.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Collections: {profile.collections}</div>
              <div>Folders: {profile.folders}</div>
              <div>Images: {profile.images}</div>
              <div>Tags: {profile.tags}</div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
      <Button className="w-full">Add New Profile</Button>
    </div>
  )
}

