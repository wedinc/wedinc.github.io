<template>
  <div class="flex flex-col bg-stone-100">
    <header
      class="flex md:h-28 h-24 w-full sticky top-0 z-10 shadow-sm text-center items-center justify-center border-b-2 border-stone-500"
    >
      <h1
        class="md:text-2xl text-xl font-semibold no-underline text-stone-700 hover:text-stone-400 font-manrope"
      >
        <NuxtLink to="/">WED Engineering<br />Team Blog</NuxtLink>
      </h1>
    </header>
    <div class="md:flex">
      <div class="md:my-12 my-6 md:flex-1">
        <slot />
      </div>
      <aside
        class="hidden md:block md:w-1/5 lg:w-1/6 md:my-4 md:border-l-2 md:border-stone-500"
      >
        <nav class="sticky top-32">
          <ul class="list-none pt-8 pl-8">
            <li class="mb-10">
              <h3 class="sidebar-title">About Us</h3>
              <a
                target="_blank"
                href="https://wed.company/"
                class="sidebar-link"
              >
                WED, Inc.
                <img
                  class="w-4 inline"
                  src="@/assets/images/link.svg"
                  alt="Link to WED Inc."
                />
              </a>
            </li>
            <li>
              <h3 class="sidebar-title">Category</h3>
              <NuxtLink to="/">
                <p class="sidebar-link">all</p>
              </NuxtLink>
              <NuxtLink to="/years/2024">
                <p class="sidebar-link">2024</p>
              </NuxtLink>
              <NuxtLink to="/years/2023">
                <p class="sidebar-link">2023</p>
              </NuxtLink>
              <NuxtLink to="/years/2022">
                <p class="sidebar-link">2022</p>
              </NuxtLink>
              <NuxtLink to="/years/2021">
                <p class="sidebar-link">2021</p>
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
    <footer
      class="flex shadow-sm text-center border-t-2 border-stone-500 items-center justify-center h-12 z-10"
    >
      <p class="mb-1 text-xs font-medium text-stone-600">&copy; WED, Inc.</p>
    </footer>
  </div>
</template>
