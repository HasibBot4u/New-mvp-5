-- Create a storage bucket for Q&A images
insert into storage.buckets (id, name, public)
values ('qna-images', 'qna-images', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'qna-images' );

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'qna-images' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete their own images"
  on storage.objects for delete
  using (
    bucket_id = 'qna-images' 
    and auth.uid() = owner
  );
