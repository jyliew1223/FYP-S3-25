from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('MyApp', '0001_initial'),
    ]

    operations = [
        # Convert existing arrays to JSON first (with schema)
        migrations.RunSQL(
            """
            ALTER TABLE "crag"
            ALTER COLUMN "image_urls" TYPE jsonb
            USING array_to_json("image_urls");
            """
        ),
        migrations.RunSQL(
            """
            ALTER TABLE "post"
            ALTER COLUMN "image_urls" TYPE jsonb
            USING array_to_json("image_urls");
            """
        ),

        # Update Django field definitions
        migrations.AlterField(
            model_name='crag',
            name='image_urls',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='post',
            name='image_urls',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='user',
            name='profile_picture',
            field=models.CharField(max_length=500, null=True),
        ),
    ]
