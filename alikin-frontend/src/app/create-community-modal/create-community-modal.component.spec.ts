import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCommunityModalComponent } from './create-community-modal.component';

describe('CreateCommunityModalComponent', () => {
  let component: CreateCommunityModalComponent;
  let fixture: ComponentFixture<CreateCommunityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateCommunityModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCommunityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
