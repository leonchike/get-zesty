// import { H1 } from "@/components/ui/typography";
// import AddGroceryInput from "@/components/groceries-view/input";
// import ListView from "@/components/groceries-view/list-view";
// import { getUserGroceries } from "@/lib/actions/grocery-actions";
// import {
//   dehydrate,
//   QueryClient,
//   HydrationBoundary,
// } from "@tanstack/react-query";

// const queryClient = new QueryClient();

// export default async function Groceries() {
//   await queryClient.prefetchQuery({
//     queryKey: ["groceryItems"],
//     queryFn: getUserGroceries,
//   });

//   return (
//     <div className="m-auto max-w-4xl">
//       <H1>Groceries</H1>
//       <div>
//         <AddGroceryInput />
//         <HydrationBoundary state={dehydrate(queryClient)}>
//           <ListView />
//         </HydrationBoundary>
//       </div>
//     </div>
//   );
// }
