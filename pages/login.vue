<script lang="ts">
</script>


<template>
  <div class="continer mx-auto px-4 sm:px-6 lg:px-8 py-24 max-w-screen-xl">
    <Card class="max-w-sm mx-auto">
      <CardHeader>
        <CardTitle class="text-2xl">
          Login
        </CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input id="password" type="password" required />
        </div>
      </CardContent>
      <CardFooter>
        <Button class="w-full">
          Sign in
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
