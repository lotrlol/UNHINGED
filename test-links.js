// Test script to insert sample user links
// Run this in your browser console or add it to your app temporarily

const insertTestLinks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    return;
  }

  const testLinks = [
    { title: 'Website', url: 'https://example.com', display_order: 1 },
    { title: 'Twitter', url: 'https://twitter.com/example', display_order: 2 },
    { title: 'Instagram', url: 'https://instagram.com/example', display_order: 3 },
    { title: 'LinkedIn', url: 'https://linkedin.com/in/example', display_order: 4 },
    { title: 'YouTube', url: 'https://youtube.com/@example', display_order: 5 }
  ];

  try {
    const { data, error } = await supabase
      .from('user_links')
      .insert(testLinks.map(link => ({ ...link, user_id: user.id })))
      .select();

    if (error) {
      console.error('Error inserting test links:', error);
    } else {
      console.log('Successfully inserted test links:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

// Run the function
insertTestLinks();
