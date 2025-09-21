# Backend Project Structure

This folder contains the GoClimb Django backend application and related documentation.

## Structure

```
Backend/
├── GoClimb/                    # Django project root
│   ├── GoClimb/               # Django settings and configuration
│   ├── MyApp/                 # Main application
│   ├── manage.py              # Django management script
│   ├── .env                   # Environment variables
│   └── requirements.txt       # Python dependencies
├── README.md                  # Original backend documentation
├── test_code_writing_guide.md # Testing guidelines
├── testing_guide.md          # Testing documentation
└── PROJECT_STRUCTURE.md      # This file
```

## Running the Application

From the project root directory:

```bash
# Run Django commands
python Backend/GoClimb/manage.py <command>

# Examples:
python Backend/GoClimb/manage.py runserver
python Backend/GoClimb/manage.py test MyApp
python Backend/GoClimb/manage.py migrate
```

## Development

All Django development should be done within the `Backend/GoClimb/` directory.

## Deployment

The project includes automatic deployment to Render after successful tests:

- **Automatic**: Deploys to Render when tests pass on `main`/`master` branch
- **Setup**: See `RENDER_DEPLOYMENT.md` for configuration instructions
- **Testing**: Use `test_deploy_hook.sh` to test your deploy hook locally

## Files

- `RENDER_DEPLOYMENT.md` - Render deployment setup guide
- `test_deploy_hook.sh` - Script to test deploy hook locally