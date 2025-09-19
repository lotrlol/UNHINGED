-- Create a function to safely increment a numeric column
CREATE OR REPLACE FUNCTION increment(
  table_name text,
  column_name text,
  id_value uuid,
  amount integer DEFAULT 1
) RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', 
                table_name, column_name, column_name)
  USING amount, id_value;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Create a function to safely decrement a numeric column
CREATE OR REPLACE FUNCTION decrement(
  table_name text,
  column_name text,
  id_value uuid,
  amount integer DEFAULT 1
) RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = GREATEST(0, %I - $1) WHERE id = $2', 
                table_name, column_name, column_name)
  USING amount, id_value;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment(text, text, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement(text, text, uuid, integer) TO authenticated;
